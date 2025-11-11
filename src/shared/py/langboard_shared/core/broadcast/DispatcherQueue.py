from typing import Any, overload
from pydantic import BaseModel
from ...Env import Env
from ..utils.decorators import class_instance, thread_safe_singleton
from .BaseDispatcherQueue import BaseDispatcherQueue


@class_instance()
@thread_safe_singleton
class DispatcherQueue(BaseDispatcherQueue):
    def __init__(self):
        if Env.BROADCAST_TYPE == "in-memory":
            from .memory import MemoryDispatcherQueue

            instance = MemoryDispatcherQueue()
        elif Env.BROADCAST_TYPE == "kafka":
            from .kafka import KafkaDispatcherQueue

            instance = KafkaDispatcherQueue()
        else:
            raise ValueError(f"Unsupported BROADCAST_TYPE: {Env.BROADCAST_TYPE}")

        self.__instance: BaseDispatcherQueue = instance

    @overload
    async def put(self, event: str, data: dict[str, Any]): ...
    @overload
    async def put(self, event: BaseModel): ...
    async def put(self, event: str | BaseModel, data: dict[str, Any] | None = None):
        if not self.__instance:
            return
        await self.__instance.put(event, data)
