from typing import Any
from core.utils.decorators import staticclass
from ...core.broker import Broker


@staticclass
class WebhookDataHelper:
    @staticmethod
    def schema(event: str, data: dict[str, Any] | None):
        return Broker.schema("webhook", {event: data or {}})
