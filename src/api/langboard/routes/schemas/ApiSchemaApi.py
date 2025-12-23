from fastapi import Query
from langboard_shared.core.routing import ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema


@AppRouter.api.get(
    "/schema/api", tags=["Schema"], responses=OpenApiSchema().suc({"apis": {"<name>": "<description>"}}).get()
)
def get_api_list():
    apis: dict[str, str] = {}
    for api_name, api_schema in AppRouter.api_routes.items():
        apis[api_name] = api_schema["description"]

    return JsonResponse(content={"apis": apis})


@AppRouter.api.get(
    "/schema/api/spec/{api_name}",
    tags=["Schema"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "schema": {
                    "name": "string",
                    "path": "string",
                    "path_params": "array[string]",
                    "method": "string",
                    "content_type": "Enum[application/json, multipart/form-data]",
                    "description": "string",
                    "form?": "object",
                    "query?": "object",
                    "file_field?": "string",
                    "request_schema_source?": "string",
                }
            }
        )
        .get()
    ),
)
def get_api_schema(api_name: str):
    api_schema = AppRouter.api_routes.get(api_name)
    if api_schema:
        return JsonResponse(content={"schema": api_schema})
    raise ApiException.NotFound_404()


@AppRouter.api.get(
    "/schema/api/list",
    tags=["Schema"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "schemas": {
                    "<api_name>": {
                        "name": "string",
                        "path": "string",
                        "path_params": "array[string]",
                        "method": "string",
                        "content_type": "Enum[application/json, multipart/form-data]",
                        "description": "string",
                        "form?": "object",
                        "query?": "object",
                        "file_field?": "string",
                        "request_schema_source?": "string",
                    }
                }
            }
        )
        .get()
    ),
)
def get_api_schema_list(api_names: str = Query(...)):
    schemas = {}
    api_name_list = api_names.split(",")
    for api_name in api_name_list:
        schema = AppRouter.api_routes.get(api_name)
        if schema:
            schemas[api_name] = schema

    return JsonResponse(content={"schemas": schemas})
