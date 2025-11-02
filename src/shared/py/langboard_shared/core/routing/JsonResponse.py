from json import dumps as json_dumps
from typing import Any, Mapping
from fastapi.responses import Response
from pydantic import BaseModel
from starlette.background import BackgroundTask
from ..utils.Converter import json_default
from .ApiErrorCode import ApiErrorCode


class JsonResponse(Response):
    media_type = "application/json"

    def __init__(
        self,
        content: Any | None = None,
        status_code: int = 200,
        headers: Mapping[str, str] | None = None,
        media_type: str | None = None,
        background: BackgroundTask | None = None,
    ) -> None:
        if not content:
            content = {}

        if isinstance(content, str):
            content = {"message": content}
        elif isinstance(content, ApiErrorCode):
            content = content.to_dict()

        super().__init__(content, status_code, headers, media_type, background)

    def render(self, content: Any) -> bytes:
        if isinstance(content, BaseModel):
            content = content.model_dump()

        return json_dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            default=json_default,
        ).encode("utf-8")
