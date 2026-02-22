import json
import os
from fastapi import status
from langboard_shared.core.routing import ApiErrorCode, BaseMiddleware, JsonResponse
from langboard_shared.domain.models import McpToolGroup
from starlette.types import Message, Receive, Send
from langboard.middlewares.McpAuthMiddleware import mcp_auth_context


class DynamicSseMiddleware(BaseMiddleware):
    """
    Dynamic SSE middleware that filters tools based on tool group.
    Expects authentication to be handled by McpAuthMiddleware before this middleware.
    """

    __auto_load__ = False

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        auth_data = mcp_auth_context.get()

        if not auth_data or "tool_group" not in auth_data:
            response = JsonResponse(ApiErrorCode.PE1001, status_code=status.HTTP_403_FORBIDDEN)
            await response(scope, receive, send)
            return

        tool_group: McpToolGroup = auth_data["tool_group"]

        tool_filter = _ToolFilter(receive, send, tool_group)

        await self.app(scope, tool_filter.receive, tool_filter.send)


class _ToolFilter:
    def __init__(self, receive: Receive, send: Send, tool_group: McpToolGroup):
        self._receive = receive
        self._send = send
        self._tool_group = tool_group
        self._is_list_tools = False
        self._is_streaming = False

    async def receive(self):
        message = await self._receive()
        if message["type"] == "http.request":
            body = message.get("body", b"").decode()
            try:
                data = json.loads(body) if body else {}
                if data.get("method") == "tools/list":
                    self._is_list_tools = True
            except Exception:
                pass
        return message

    async def send(self, message: Message):
        if not self._is_list_tools:
            return await self._send(message)

        if message["type"] == "http.response.start":
            headers = dict(message.get("headers", []))
            content_type: str = headers.get(b"content-type", b"").decode()
            if content_type.startswith("text/event-stream"):
                self._is_streaming = True

        body: str = message.get("body", b"").decode()
        try:
            if self._is_streaming:
                events = body.split(os.linesep)
                for event in events:
                    if not event.strip() or "data: " not in event:
                        continue
                    event_data_raw = event.split("data: ")[-1].strip()
                    try:
                        event_data = json.loads(event_data_raw)
                        tools = self._get_filtered_tools(event_data)
                        if not tools:
                            continue
                        event_data["result"]["tools"] = tools
                        body = body.replace(event_data_raw, json.dumps(event_data))
                        message["body"] = body.encode()
                    except Exception:
                        continue
            else:
                event_data = json.loads(body)
                if "result" in event_data and "tools" in event_data["result"]:
                    tools = self._get_filtered_tools(event_data)
                    event_data["result"]["tools"] = tools
                    message["body"] = json.dumps(event_data).encode()
        except Exception:
            pass
        return await self._send(message)

    def _get_filtered_tools(self, event_data: dict) -> list[dict] | None:
        if "result" not in event_data or "tools" not in event_data["result"]:
            return None
        tools = event_data["result"]["tools"]
        tools = [tool for tool in tools if tool["name"] in self._tool_group.tools]
        return tools
