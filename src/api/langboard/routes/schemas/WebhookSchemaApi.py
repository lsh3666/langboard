from typing import Any
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from langboard_shared.core.broker import Broker
from langboard_shared.core.routing import AppRouter, JsonResponse
from langboard_shared.domain.models import Bot, User
from langboard_shared.domain.models.bases import BotTriggerCondition
from langboard_shared.Env import Env


@AppRouter.api.get("/schema/webhook", tags=["Schema"], response_class=HTMLResponse)
async def webhook_docs():
    return get_swagger_ui_html(openapi_url="/schema/webhook.json", title=Env.PROJECT_NAME.capitalize())


@AppRouter.api.get("/schema/webhook.json", include_in_schema=False)
async def webhook_openapi():
    schemas = Broker.get_schema("webhook")
    bot_schema = {
        **Bot.api_schema(),
        "app_api_token": "string",
        "prompt": "string",
    }
    bot_schema = _make_object_property("bot", bot_schema)
    user_schema = User.api_schema()
    user_schema = _make_object_property("user", user_schema)

    for schema_name in schemas:
        schema = schemas[schema_name]
        schemas[schema_name] = {
            "title": schema_name.replace("_", " ").capitalize(),
            "type": "object",
            "properties": {
                "event": {"type": "string", "title": "Event", "enum": [schema_name]},
                "data": _make_object_property("data", schema),
            },
        }

    return JsonResponse(
        content={
            "openapi": "3.1.0",
            "info": {
                "title": Env.PROJECT_NAME.capitalize(),
                "version": Env.PROJECT_VERSION,
            },
            "components": {"schemas": schemas},
            "shared": {
                "Bot": bot_schema,
                "User": user_schema,
            },
        }
    )


@AppRouter.api.get("/schema/bot/trigger-conditions", tags=["Schema"])
async def get_bot_trigger_conditions():
    return JsonResponse(content={"conditions": [condition.value for condition in BotTriggerCondition]})


def _make_object_property(schema_name: str, schema: dict[str, Any]):
    properties, required = _make_property(schema)

    return {
        "type": "object",
        "title": schema_name.replace("_", " ").capitalize(),
        "properties": properties,
        "required": required,
    }


def _make_property(properties: dict[str, Any]):
    required = []
    schema = {}
    for property_name in properties:
        property_value: str | dict = properties[property_name]
        if isinstance(property_value, dict):
            if "oneOf" in property_value:
                schema[property_name] = {
                    "oneOf": [
                        _make_object_property(oneOf, property_value["oneOf"][oneOf])
                        for oneOf in property_value["oneOf"]
                    ]
                }
            else:
                schema[property_name] = _make_object_property(property_name, property_value)
            continue

        if property_value.count("?") == 0:
            required.append(property_name)

        schema[property_name] = {
            "type": property_value.replace("?", ""),
            "title": property_name.replace("_", " ").capitalize(),
        }

    return schema, required
