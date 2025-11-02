from typing import Any
from pydantic import BaseModel


class WebhookModel(BaseModel):
    event: str
    data: dict[str, Any]
