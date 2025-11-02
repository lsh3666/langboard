from typing import Literal
from langboard_shared.core.schema import OpenApiSchema


def create_metadata_api_schema(get_type: Literal["list", "key"] | None = None) -> OpenApiSchema:
    schema = OpenApiSchema().auth().forbidden()
    if get_type:
        if get_type == "list":
            schema = schema.suc({"metadata": [{"key": "value"}]})
        elif get_type == "key":
            schema = schema.suc({"key": "value?"})
    return schema
