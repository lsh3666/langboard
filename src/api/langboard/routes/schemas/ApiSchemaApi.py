from core.routing import AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import Query, status


@AppRouter.api.get(
    "/schema/api", tags=["Schema"], responses=OpenApiSchema().suc({"apis": {"<name>": "<description>"}}).get()
)
async def get_api_list():
    apis: dict[str, str] = {}
    for api_name, api_schema in AppRouter.api_routes.items():
        apis[api_name] = api_schema["description"]

    return JsonResponse(content={"apis": apis})


@AppRouter.api.get(
    "/schema/api/spec/{api_name}",
    tags=["Schema"],
    responses=OpenApiSchema()
    .suc(
        {
            "schema": {
                "name": "string",
                "path": "string",
                "path_params": "array[string]",
                "method": "string",
                "content_type": "Literal[application/json, multipart/form-data]",
                "description": "string",
                "form?": "object",
                "query?": "object",
                "file_field?": "string",
                "request_schema_source?": "string",
            }
        }
    )
    .get(),
)
async def get_api_schema(api_name: str):
    api_schema = AppRouter.api_routes.get(api_name)
    if api_schema:
        return JsonResponse(content={"schema": api_schema})
    return JsonResponse(status_code=status.HTTP_404_NOT_FOUND)


@AppRouter.api.get(
    "/schema/api/list",
    tags=["Schema"],
    responses=OpenApiSchema()
    .suc(
        {
            "schemas": {
                "<api_name>": {
                    "name": "string",
                    "path": "string",
                    "path_params": "array[string]",
                    "method": "string",
                    "content_type": "Literal[application/json, multipart/form-data]",
                    "description": "string",
                    "form?": "object",
                    "query?": "object",
                    "file_field?": "string",
                    "request_schema_source?": "string",
                }
            }
        }
    )
    .get(),
)
async def get_api_schema_list(api_names: str = Query(...)):
    schemas = {}
    api_name_list = api_names.split(",")
    for api_name in api_name_list:
        schema = AppRouter.api_routes.get(api_name)
        if schema:
            schemas[api_name] = schema

    return JsonResponse(content={"schemas": schemas})
