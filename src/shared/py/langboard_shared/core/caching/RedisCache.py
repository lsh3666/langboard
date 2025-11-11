from inspect import iscoroutinefunction
from typing import Any, Callable, TypeVar, overload
from redis import Redis
from ...Env import Env
from .BaseCache import BaseCache


_TCastReturn = TypeVar("_TCastReturn")


class RedisCache(BaseCache):
    def __init__(self):
        super().__init__()
        self._cache = Redis.from_url(Env.CACHE_URL, decode_responses=True)

    @overload
    async def get(self, key: str) -> Any | None: ...
    @overload
    async def get(self, key: str, caster: Callable[[Any], _TCastReturn]) -> _TCastReturn | None: ...
    async def get(self, key: str, caster: Callable[[Any], _TCastReturn] | None = None) -> Any | None:
        raw_value = await self.__run_redis_method("get", key)
        if raw_value is None:
            return None

        value = await self._cast_get(raw_value, caster)
        return value

    async def has(self, key: str) -> bool:
        return await self.__run_redis_method("exists", key)

    async def set(self, key: str, value: Any, ttl: int = 0) -> None:
        casted_value = await self._cast_set(value)
        await self.__run_redis_method("set", key, casted_value, ex=ttl if ttl > 0 else None)

    async def delete(self, key: str) -> None:
        if await self.__run_redis_method("exists", key):
            await self.__run_redis_method("delete", key)

    async def clear(self) -> None:
        await self.__run_redis_method("flushdb")

    async def __run_redis_method(self, command: str, *args: Any, **kwargs) -> Any:
        method = getattr(self._cache, command)
        if iscoroutinefunction(method):
            return await method(*args, **kwargs)
        else:
            return method(*args, **kwargs)
