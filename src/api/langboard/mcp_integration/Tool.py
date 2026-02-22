from inspect import Parameter, signature
from types import UnionType
from typing import Any, Callable, Literal, TypedDict, _UnionGenericAlias, get_origin  # type: ignore
from langboard_shared.core.utils.decorators import class_instance, thread_safe_singleton


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

    def add(self, accessible_type: _TAccessibleType = "all") -> Callable[[Callable], Callable]:
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
                json_type = "string"
                enum_values = None

                if isinstance(param_annotation, UnionType) or isinstance(param_annotation, _UnionGenericAlias):
                    args = [a for a in param_annotation.__args__ if a not in (type(None), None)]
                    if args and hasattr(args[0], "__bases__"):
                        try:
                            enum_values = [e.value for e in args[0]]
                        except (TypeError, AttributeError):
                            pass
                elif hasattr(param_annotation, "__bases__"):
                    try:
                        enum_values = [e.value for e in param_annotation]
                    except (TypeError, AttributeError):
                        pass

                if enum_values is None:
                    json_type, _ = self._get_param_type(param_annotation, param)
                else:
                    json_type = "string"

                if enum_values:
                    prop = {"type": json_type, "enum": enum_values}
                else:
                    prop = {"type": json_type}

                if param.default != Parameter.empty:
                    prop["default"] = param.default

                properties[param_name] = prop
                if param.default == Parameter.empty:
                    required.append(param_name)

            self._tools[func.__name__] = {
                "description": func.__doc__ or func.__name__,
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

    def _get_param_type(self, param_annotation: Any, param: Parameter) -> tuple[str, list[str] | None]:
        json_type = "string"
        enum_values = None

        if param_annotation is int:
            json_type = "integer"
        elif param_annotation is bool:
            json_type = "boolean"
        elif param.annotation is not Parameter.empty:
            if isinstance(param_annotation, UnionType) or isinstance(param_annotation, _UnionGenericAlias):
                args = [a for a in param_annotation.__args__ if a not in (type(None), None)]
                if args and args[0] is int:
                    json_type = "integer"
                elif args and args[0] is bool:
                    json_type = "boolean"
                elif args and args[0] is float:
                    json_type = "number"
            elif hasattr(param_annotation, "__origin__"):
                origin = get_origin(param_annotation)
                if origin is list:
                    json_type = "array"
                elif origin is dict:
                    json_type = "object"

        return json_type, enum_values
