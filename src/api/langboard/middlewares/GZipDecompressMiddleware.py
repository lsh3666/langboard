from gzip import decompress
from langboard_shared.core.routing import BaseMiddleware
from starlette.datastructures import Headers
from starlette.types import Message


class GZipDecompressMiddleware(BaseMiddleware):
    """Decompresses the request body if it is compressed with GZip."""

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)

        async def wrapped_receive() -> Message:
            message = await receive()
            if message["type"] == "http.disconnect":
                return message

            body = message.get("body", b"")
            if "gzip" in headers.getlist("content-encoding"):
                body = decompress(body)
                message["body"] = body
            return message

        await self.app(scope, wrapped_receive, send)
