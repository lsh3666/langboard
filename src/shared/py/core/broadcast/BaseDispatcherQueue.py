from abc import ABC, abstractmethod
from json import loads as json_loads
from pathlib import Path
from typing import Any, cast
from pydantic import BaseModel
from ..caching import Cache
from ..Env import Env
from ..types import SafeDateTime
from ..utils.String import create_short_unique_id
from .DispatcherModel import DispatcherModel


class BaseDispatcherQueue(ABC):
    def __init__(self):
        self.__broadcast_dir: Path = cast(Path, None)

    @abstractmethod
    async def put(self, event: str | BaseModel, data: dict[str, Any] | None = None): ...

    def set_broadcast_dir(self, broadcast_dir: Path):
        self.__broadcast_dir = broadcast_dir

    async def _record_model(
        self, event: str | DispatcherModel, data: dict[str, Any] | None = None, file_only: bool = False
    ) -> str:
        now_str = str(SafeDateTime.now().timestamp()).replace(".", "_")
        random_str = create_short_unique_id(10)

        model = DispatcherModel(event=event, data=data or {}) if isinstance(event, str) else event

        if Env.CACHE_TYPE == "redis":
            cache_key = f"broadcast-{now_str}-{random_str}"
            # Prevent enums from being Enum.Name
            await Cache.set(cache_key, json_loads(model.model_dump_json())["data"], 3 * 60)
            return cache_key

        name = f"{now_str}-{random_str}.json" if not file_only else f"{now_str}-{random_str}-fileonly.json"

        if not self.__broadcast_dir or not self.__broadcast_dir.is_dir():
            return name

        file_path = self.__broadcast_dir / name

        with open(file_path, "w", encoding="utf-8") as file:
            file.write(model.model_dump_json())
            file.close()

        return name
