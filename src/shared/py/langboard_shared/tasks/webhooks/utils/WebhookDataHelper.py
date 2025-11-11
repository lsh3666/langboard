from typing import Any
from ....core.broker import Broker
from ....core.utils.decorators import staticclass


@staticclass
class WebhookDataHelper:
    @staticmethod
    def schema(event: str, data: dict[str, Any] | None):
        return Broker.schema("webhook", {event: data or {}})
