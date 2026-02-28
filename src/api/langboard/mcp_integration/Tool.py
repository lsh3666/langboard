from enum import Enum
from inspect import Parameter, signature
from types import UnionType
from typing import Any, Callable, Literal, TypedDict, _UnionGenericAlias, get_origin  # type: ignore
from langboard_shared.core.utils.decorators import class_instance, thread_safe_singleton
from pydantic import BaseModel


_TAccessibleType = Literal["all", "user", "bot"]


class McpToolMetadata(TypedDict):
    description: str
    handler: Callable
    input_schema: dict
    accessible_type: _TAccessibleType
    exclude: list[str]


@class_instance()
@thread_safe_singleton
class McpTool:
    def __init__(self):
        self._tools: dict[str, McpToolMetadata] = {}

    def add(
        self, accessible_type: _TAccessibleType = "all", description: str | None = None
    ) -> Callable[[Callable], Callable]:
        def decorator(func: Callable) -> Callable:
            sig = signature(func)
            params = sig.parameters
            exclude = []

            for param_name, param in params.items():
                if param.default != Parameter.empty:
                    exclude.append(param_name)
                elif param.annotation != Parameter.empty:
                    annotation_str = str(param.annotation)
                    if "User" in annotation_str or "Bot" in annotation_str:
                        exclude.append(param_name)
                    elif "DomainService" in annotation_str:
                        exclude.append(param_name)

            properties = {}
            required = []

            for param_name, param in params.items():
                if param_name in exclude:
                    continue

                param_annotation = param.annotation

                prop = self._get_param_type(param_annotation, param)

                if param.default != Parameter.empty:
                    prop["default"] = param.default

                properties[param_name] = prop
                if param.default == Parameter.empty:
                    required.append(param_name)

            self._tools[func.__name__] = {
                "description": description or func.__doc__ or func.__name__,
                "handler": func,
                "input_schema": {"type": "object", "properties": properties, "required": required},
                "accessible_type": accessible_type,
                "exclude": exclude,
            }

            return func

        return decorator

    def get_tools(self) -> dict[str, McpToolMetadata]:
        return self._tools

    def get_tool(self, tool_name: str) -> McpToolMetadata | None:
        return self._tools.get(tool_name)

    def _get_param_type(self, param_annotation: Any, param: Parameter) -> dict:
        schema: dict = {"type": "string"}

        if isinstance(param_annotation, type) and issubclass(param_annotation, Enum):
            schema["type"] = "string"
            schema["enum"] = [e.value for e in param_annotation]
        elif param_annotation is int:
            schema["type"] = "integer"
        elif param_annotation is bool:
            schema["type"] = "boolean"
        elif param.annotation is not Parameter.empty:
            if isinstance(param_annotation, UnionType) or isinstance(param_annotation, _UnionGenericAlias):
                args = [a for a in param_annotation.__args__ if a not in (type(None), None)]
                if args and args[0] is int:
                    schema["type"] = "integer"
                elif args and args[0] is bool:
                    schema["type"] = "boolean"
                elif args and args[0] is float:
                    schema["type"] = "number"
            elif hasattr(param_annotation, "__origin__"):
                origin = get_origin(param_annotation)
                if origin is list:
                    schema["type"] = "array"
                elif origin is dict:
                    schema["type"] = "object"
        elif isinstance(param_annotation, type) and issubclass(param_annotation, BaseModel):
            schema["type"] = "object"
            api_schema: Callable[[], str] | None = getattr(param_annotation, "api_schema", None)
            if api_schema and callable(api_schema):
                schema["properties"] = api_schema()
            else:
                # Use Pydantic's built-in schema generation
                try:
                    json_schema = param_annotation.model_json_schema()
                    if "properties" in json_schema:
                        schema["properties"] = json_schema["properties"]
                    if "required" in json_schema:
                        schema["required"] = json_schema["required"]
                except Exception:
                    pass

        return schema
