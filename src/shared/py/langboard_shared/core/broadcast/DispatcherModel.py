from pydantic import BaseModel
from ..types import SnowflakeID


def _convert_id_for_js(v: dict):
    for key, value in v.items():
        if isinstance(value, SnowflakeID):
            v[key] = str(value)
        elif isinstance(value, dict):
            v[key] = _convert_id_for_js(value)
        else:
            v[key] = value

    return v


class DispatcherModel(BaseModel):
    event: str
    data: dict

    class Config:
        json_encoders = {
            dict: _convert_id_for_js,
        }
