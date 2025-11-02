from datetime import datetime
from enum import Enum
from typing import Any
from pydantic import BaseModel


def json_default(value: Any) -> str:
    if isinstance(value, datetime):
        value = value.isoformat()
        if not value.count("+"):
            value = f"{value}+00:00"
        return value
    if isinstance(value, Enum):
        return value.value
    return str(value)


def convert_python_data(data: Any, recursive: bool = False) -> Any:
    if isinstance(data, datetime):
        data = data.isoformat()
        if not data.count("+"):
            data = f"{data}+00:00"
        return data

    if not recursive:
        if isinstance(data, BaseModel):
            return data.model_dump()
        return data

    if isinstance(data, BaseModel):
        model = data.model_dump()
        for key, value in model.items():
            model[key] = convert_python_data(value, recursive=True)
        return model
    elif isinstance(data, list):
        return [convert_python_data(item, recursive=True) for item in data]
    elif isinstance(data, dict):
        return {key: convert_python_data(value, recursive=True) for key, value in data.items()}
    return data
