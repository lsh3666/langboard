from json import dumps as json_dumps
from json import loads as json_loads
from typing import cast
from fastapi import Request, status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import AppExceptionHandlingRoute, AppRouter, JsonResponse
from langboard_shared.core.utils.Converter import json_default
from langboard_shared.domain.models import Bot, User
from langboard_shared.security import Auth
from starlette.types import Message
from .BatchForm import BatchForm


_cached_apis: dict[str, str] = {}


@AppRouter.schema(form=BatchForm)
@AppRouter.api.post(
    "/batch",
    tags=["Batcher"],
    description="Batch API for processing multiple requests in a single call. The response will be a list of responses corresponding to each request schema provided in the form.",
)
@AuthFilter.add()
async def batch_apis(request: Request, form: BatchForm, user_or_bot: User | Bot = Auth.scope("all")):
    if not _cached_apis:
        _set_cache_apis()

    API_METHODS = {"GET", "POST", "PUT", "DELETE"}
    responses = []
    for request_schema in form.request_schemas:
        if request_schema.method.upper() not in API_METHODS:
            responses.append(_batch_response({}, status.HTTP_400_BAD_REQUEST))
            continue

        if request_schema.path_or_api_name in _cached_apis:
            request_schema.path_or_api_name = _cached_apis[request_schema.path_or_api_name]
            try:
                request_schema.path_or_api_name = request_schema.path_or_api_name.format(
                    **{**(request_schema.form or {}), **(request_schema.query or {})}
                )
            except Exception:
                pass

        query_string = _query_dict_to_bytes(request_schema.query or {})
        scope = {
            "type": "http",
            "method": request_schema.method,
            "path": request_schema.path_or_api_name,
            "query_string": query_string,
            "headers": request.headers.raw,
            "auth": user_or_bot,
            "is_batch": True,
        }

        response = {}
        responses.append(response)

        async def receive():
            message = b""
            if request_schema.form:
                message = json_dumps(request_schema.form, default=json_default).encode()
            return {"type": "http.request", "body": message, "more_body": False}

        async def send(message: Message):
            message_type = message.get("type")
            if message_type == "http.response.start":
                response["status"] = message.get("status", status.HTTP_200_OK)
                return

            if message_type != "http.response.body":
                return

            body = message.get("body", b"{}")
            try:
                response["body"] = json_loads(body) if body else {}
            except Exception:
                response["body"] = {"error": "Invalid JSON response"}

        await AppRouter.get_app()(scope, receive, send)

    return JsonResponse(content=responses, status_code=status.HTTP_200_OK)


def _query_dict_to_bytes(query: dict) -> bytes:
    return b"&".join(f"{key}={value}".encode() for key, value in query.items() if value is not None)


def _batch_response(content: dict, status_code: int = status.HTTP_200_OK) -> dict:
    return {"status": status_code, "body": content}


def _set_cache_apis():
    for route in AppRouter.get_app().routes:
        route = cast(AppExceptionHandlingRoute, route)
        route_name = route.name
        _cached_apis[route_name] = route.path
