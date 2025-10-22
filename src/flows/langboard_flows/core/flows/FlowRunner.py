import asyncio
import time
from typing import AsyncGenerator, Literal
from core.caching import Cache
from core.db import DbSession
from langflow.events.event_manager import EventManager, create_stream_tokens_event_manager
from langflow.exceptions.serialization import SerializationError
from langflow.graph import Graph
from langflow.graph.schema import RunOutputs
from langflow.schema.schema import INPUT_FIELD_NAME
from langflow.services.deps import get_settings_service
from models import Bot, BotLog, InternalBot, Project
from models.BotLog import BotLogMessage, BotLogType
from publishers import CardPublisher, ProjectBotPublisher, ProjectColumnPublisher
from ..logger import Logger
from ..schema import FlowRequestModel, InputValueRequest, RunResponse
from ..schema.Exception import InvalidChatInputError


class FlowRunner:
    def __init__(
        self,
        graph: Graph,
        input_request: FlowRequestModel,
        stream: bool = False,
        raw_project: dict | None = None,
        raw_bot: tuple[Literal["bot", "internal_bot"], dict] | None = None,
        raw_bot_log: tuple[dict | None, dict | None] | None = None,
    ):
        self.graph = graph
        self.input_request = input_request
        self.stream = stream
        self.raw_project = raw_project
        self.raw_bot = raw_bot
        self.raw_bot_log = raw_bot_log

    async def run_stream(self):
        asyncio_queue = asyncio.Queue()
        asyncio_queue_client_consumed = asyncio.Queue()
        event_manager = create_stream_tokens_event_manager(queue=asyncio_queue)
        main_task = asyncio.create_task(
            self.__run_flow_generator(
                event_manager=event_manager,
                client_consumed_queue=asyncio_queue_client_consumed,
            )
        )

        return main_task, self.__consume_and_yield(asyncio_queue, asyncio_queue_client_consumed)

    async def run(self):
        return await self.__simple_run_flow()

    async def __run_flow_generator(self, event_manager: EventManager, client_consumed_queue: asyncio.Queue) -> None:
        try:
            result = await self.__simple_run_flow(
                event_manager=event_manager,
            )
            event_manager.on_end(data={"result": result.model_dump()})
            await client_consumed_queue.get()
        except (ValueError, InvalidChatInputError, SerializationError) as e:
            Logger.main.error(f"Error running flow: {e}")
            event_manager.on_error(data={"error": str(e)})
        finally:
            await event_manager.queue.put((None, None, time.time))

    async def __consume_and_yield(self, queue: asyncio.Queue, client_consumed_queue: asyncio.Queue) -> AsyncGenerator:
        while True:
            event_id, value, put_time = await queue.get()
            if value is None:
                break
            get_time = time.time()
            yield value
            get_time_yield = time.time()
            client_consumed_queue.put_nowait(event_id)
            Logger.main.debug(
                f"consumed event {event_id} "
                f"(time in queue, {get_time - put_time:.4f}, "
                f"client {get_time_yield - get_time:.4f})"
            )

    async def __simple_run_flow(self, event_manager: EventManager | None = None):
        self.__validate_input_and_tweaks()

        task_result: list[RunOutputs] = []
        inputs = None
        if self.input_request.input_value is not None:
            inputs = [
                InputValueRequest(
                    components=[],
                    input_value=self.input_request.input_value,
                    type=self.input_request.input_type,
                )
            ]
        if self.input_request.output_component:
            outputs = [self.input_request.output_component]
        else:
            outputs = [
                vertex.id
                for vertex in self.graph.vertices
                if self.input_request.output_type == "debug"
                or (
                    vertex.is_output
                    and (self.input_request.output_type == "any" or self.input_request.output_type in vertex.id.lower())  # type: ignore[operator]
                )
            ]

        await self._update_log(BotLogType.Info, "Running flow...", "running")
        task_result, session_id = await self.__run_graph_internal(
            inputs=inputs,
            outputs=outputs,
            event_manager=event_manager,
        )

        return RunResponse(outputs=task_result, session_id=session_id)

    async def __run_graph_internal(
        self,
        inputs: list[InputValueRequest] | None = None,
        outputs: list[str] | None = None,
        event_manager: EventManager | None = None,
    ) -> tuple[list[RunOutputs], str]:
        inputs = inputs or []
        components = []
        inputs_list = []
        types = []
        for input_value_request in inputs:
            if input_value_request.input_value is None:
                Logger.main.warning("InputValueRequest input_value cannot be None, defaulting to an empty string.")
                input_value_request.input_value = ""
            components.append(input_value_request.components or [])
            inputs_list.append({INPUT_FIELD_NAME: input_value_request.input_value})
            types.append(input_value_request.type)

        fallback_to_env_vars = get_settings_service().settings.fallback_to_env_var
        self.graph.session_id = self.input_request.session_id

        run_outputs = []
        await self._publish_status("running")
        try:
            run_outputs = await self.graph.arun(
                inputs=inputs_list,
                inputs_components=components,
                types=types,
                outputs=outputs or [],
                stream=self.stream,
                session_id=self.graph.session_id,
                fallback_to_env_vars=fallback_to_env_vars,
                event_manager=event_manager,
            )
            await self._update_log(BotLogType.Success, "Flow successfully completed", "stopped")
        except Exception as e:
            Logger.main.exception(e)
            await self._update_log(BotLogType.Error, str(e), "stopped")

        await self._publish_status("stopped")

        return run_outputs, self.graph.session_id

    def __validate_input_and_tweaks(self) -> None:
        if not self.input_request.tweaks:
            return

        for key, value in self.input_request.tweaks.items():
            if not isinstance(value, dict):
                continue

            input_value = value.get("input_value")
            if input_value is None:
                continue

            request_has_input = self.input_request.input_value is not None

            if any(chat_key in key for chat_key in ("ChatInput", "Chat Input")):
                if request_has_input and self.input_request.input_type == "chat":
                    msg = "If you pass an input_value to the chat input, you cannot pass a tweak with the same name."
                    raise InvalidChatInputError(msg)

            elif (
                any(text_key in key for text_key in ("TextInput", "Text Input"))
                and request_has_input
                and self.input_request.input_type == "text"
            ):
                msg = "If you pass an input_value to the text input, you cannot pass a tweak with the same name."
                raise InvalidChatInputError(msg)

    async def _update_log(self, log_type: BotLogType, stack: str, status: Literal["running", "stopped"]) -> None:
        if not self.raw_bot_log:
            return
        log, scope_log = self.raw_bot_log
        if not log:
            return

        log = BotLog(**log)
        log.log_type = log_type
        log_stack = BotLogMessage(message=stack, log_type=log_type)
        message_stack = log.message_stack
        message_stack.append(log_stack)
        log.message_stack = message_stack

        with DbSession.use(readonly=False) as db:
            db.update(log)

        if self.raw_project and scope_log:
            project = Project(**self.raw_project)
            await ProjectBotPublisher.log_stack_added(project, log, log_stack, status)

    async def _publish_status(self, status: Literal["running", "stopped"]) -> None:
        if not self.raw_project or not self.input_request.tweaks or not self.raw_bot:
            return

        rest_data = self.input_request.tweaks.get("rest_data")
        if not rest_data:
            return

        column_uid = rest_data.get("project_column_uid")
        card_uid = rest_data.get("card_uid")
        if not column_uid and not card_uid:
            return

        project = Project(**self.raw_project)
        project_uid = project.get_uid()
        bot_type, bot_data = self.raw_bot
        bot = Bot(**bot_data) if bot_type == "bot" else InternalBot(**bot_data)
        bot_uid = bot.get_uid()

        if card_uid:
            target_type = "card"
            publisher = CardPublisher
            target_uid = card_uid
        elif column_uid:
            target_type = "project_column"
            publisher = ProjectColumnPublisher
            target_uid = column_uid
        else:
            return

        status_map: dict = await Cache.get("bot.status.map") or {}
        if project_uid not in status_map:
            status_map[project_uid] = {}
        if target_type not in status_map[project_uid]:
            status_map[project_uid][target_type] = {}
        if target_uid not in status_map[project_uid][target_type]:
            status_map[project_uid][target_type][target_uid] = []
        status_map[project_uid][target_type][target_uid].append(bot_uid)

        await Cache.set("bot.status.map", status_map, ttl=24 * 60 * 60)
        await publisher.bot_status_changed(project_uid, bot_uid, target_uid, status)
