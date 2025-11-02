from typing import Any
from ..BaseDispatcherQueue import BaseDispatcherQueue
from ..DispatcherModel import DispatcherModel


class MemoryDispatcherQueue(BaseDispatcherQueue):
    async def put(self, event: str | DispatcherModel, data: dict[str, Any] | None = None):
        await self._record_model(event, data, file_only=True)
