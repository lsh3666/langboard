from json import dumps as json_dumps
from json import loads as json_loads
from typing import Literal, cast
from fastapi import BackgroundTasks, HTTPException, status
from fastapi.responses import StreamingResponse
from langboard_shared.core.db import DbSession, SqlBuilder
from langboard_shared.core.logger import Logger
from langboard_shared.core.resources import get_resource_path
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.types import SnowflakeID
from langboard_shared.helpers import ModelHelper, ServiceHelper
from langboard_shared.models import BotLog, Project
from langboard_shared.models.BaseBotModel import BotPlatform, BotPlatformRunningType
from langboard_shared.models.bases import BaseBotLogModel
from langboard_shared.models.Bot import Bot
from langboard_shared.models.InternalBot import InternalBot
from langflow.load import aload_flow_from_json
from sqlalchemy import Row
from ..core.flows import FlowRunner
from ..core.schema import FlowRequestModel
from ..core.schema.Exception import APIException, InvalidChatInputError


@AppRouter.api.post("/api/v1/run/{anypath}")
async def run_flow(api_request: FlowRequestModel, stream: bool = False):
    result = _get_flow_json(api_request)
    if isinstance(result, ApiErrorCode):
        return JsonResponse(content=result, status_code=status.HTTP_404_NOT_FOUND)

    bot, bot_json = result
    graph = await aload_flow_from_json(flow=json_loads(bot_json), tweaks=api_request.tweaks)

    project = _get_raw_project(api_request)
    bot_log = _get_raw_bot_log(api_request)

    runner = FlowRunner(
        graph,
        api_request,
        stream,
        project,
        (cast(Literal["bot", "internal_bot"], bot.__tablename__), bot.model_dump()),
        bot_log,
    )

    if runner.stream:
        result = await runner.run_stream()
        main_task, response_generator = result

        async def on_disconnect() -> None:
            Logger.main.debug("Client disconnected, closing tasks")
            main_task.cancel()

        return StreamingResponse(response_generator, background=on_disconnect, media_type="text/event-stream")  # type: ignore

    try:
        result = await runner.run()
    except ValueError as exc:
        if "badly formed hexadecimal UUID string" in str(exc):
            # This means the Flow ID is not a valid UUID which means it can't find the flow
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        if "not found" in str(exc):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        raise APIException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, exception=exc) from exc
    except InvalidChatInputError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise APIException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, exception=exc) from exc

    return result


@AppRouter.api.post("/api/v1/webhook/{anypath}")
async def webhook_run_flow(api_request: FlowRequestModel, background_tasks: BackgroundTasks):
    result = _get_flow_json(api_request)
    if isinstance(result, ApiErrorCode):
        return JsonResponse(content=result, status_code=status.HTTP_404_NOT_FOUND)

    bot, bot_json = result
    if not api_request.tweaks:
        api_request.tweaks = {}
    api_request.tweaks["Webhook"] = {"data": {"tweaks": json_dumps(api_request.tweaks)}}

    graph = await aload_flow_from_json(flow=json_loads(bot_json), tweaks=api_request.tweaks)

    project = _get_raw_project(api_request)
    bot_log = _get_raw_bot_log(api_request)

    runner = FlowRunner(
        graph,
        api_request,
        raw_project=project,
        raw_bot=(cast(Literal["bot", "internal_bot"], bot.__tablename__), bot.model_dump()),
        raw_bot_log=bot_log,
    )

    error_msg = ""
    try:
        background_tasks.add_task(runner.run)
    except Exception as exc:
        error_msg = str(exc)
        raise HTTPException(status_code=500, detail=error_msg) from exc

    return JsonResponse(content={"message": "Task started in the background", "status": "in progress"})


def _get_flow_json(api_request: FlowRequestModel) -> ApiErrorCode | tuple[InternalBot | Bot, str]:
    if api_request.run_type == "internal_bot":
        bot_class = InternalBot
        bot_code = ApiErrorCode.NF3001
    elif api_request.run_type == "bot":
        bot_class = Bot
        bot_code = ApiErrorCode.NF3004
    else:
        return ApiErrorCode.NF3002

    bot = None
    with DbSession.use(readonly=True) as db:
        result = db.exec(
            SqlBuilder.select.table(bot_class).where((bot_class.id == SnowflakeID.from_short_code(api_request.uid)))
        )
        bot = result.first()

    if isinstance(bot, Row):
        bot = bot._data

    if isinstance(bot, InternalBot):
        if bot.platform == BotPlatform.Default and bot.platform_running_type == BotPlatformRunningType.Default:
            return bot, _get_default_flow(api_request.tweaks)
        return bot, bot.value
    elif isinstance(bot, Bot):
        return bot, _get_default_flow(api_request.tweaks)
    else:
        return bot_code


def _get_raw_bot_log(api_request: FlowRequestModel) -> tuple[dict | None, dict | None]:
    bot_log = None
    scope_log = None
    if not api_request.log_uid:
        return bot_log, scope_log

    query = SqlBuilder.select.table(BotLog)
    if api_request.scope_log_table:
        scope_log_class = ModelHelper.get_model_by_table_name(api_request.scope_log_table)
        if scope_log_class and isinstance(scope_log_class, type) and issubclass(scope_log_class, BaseBotLogModel):
            query = SqlBuilder.select.tables(BotLog, scope_log_class).join(
                scope_log_class, scope_log_class.column("bot_log_id") == BotLog.id
            )
    query = query.where(BotLog.id == SnowflakeID.from_short_code(api_request.log_uid))

    with DbSession.use(readonly=True) as db:
        result = db.exec(query)
        bot_log = result.first()

    if isinstance(bot_log, Row):
        bot_log = bot_log._data

    if not isinstance(bot_log, tuple) or len(bot_log) != 2:
        if isinstance(bot_log, tuple):
            bot_log = bot_log[0]
        bot_log = bot_log.model_dump() if bot_log else None, scope_log
    else:
        bot_log = bot_log[0].model_dump(), bot_log[1].model_dump()
    return bot_log


def _get_raw_project(api_request: FlowRequestModel) -> dict | None:
    if not api_request.project_uid:
        return None

    project = ServiceHelper.get_by_param(Project, api_request.project_uid)
    return project.model_dump() if project else None


def _get_default_flow(tweaks: dict | None = None) -> str:
    json_filename = "default"
    if tweaks:
        if "Ollama" in tweaks:
            json_filename = "ollama"
        elif "LM Studio" in tweaks:
            json_filename = "lm_studio"

    flow_json_path = get_resource_path("flows", f"{json_filename}_flow.json")
    with open(flow_json_path, "r", encoding="utf-8") as f:
        default_flow_json = f.read()
    return default_flow_json
