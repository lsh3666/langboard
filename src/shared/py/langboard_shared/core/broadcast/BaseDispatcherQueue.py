from abc import ABC, abstractmethod
from json import loads as json_loads
from pathlib import Path
from typing import Any
from pydantic import BaseModel
from ...Env import Env
from ..caching import Cache
from ..types import SafeDateTime
from ..utils.String import create_short_unique_id
from .DispatcherModel import DispatcherModel


_BROADCAST_DIR: Path = Env.DATA_DIR / "broadcast"


class BaseDispatcherQueue(ABC):
    @abstractmethod
    async def put(self, event: str | BaseModel, data: dict[str, Any] | None = None): ...

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

        if not _BROADCAST_DIR or not _BROADCAST_DIR.is_dir():
            return name

        file_path = _BROADCAST_DIR / name

        with open(file_path, "w", encoding="utf-8") as file:
            file.write(model.model_dump_json())
            file.close()

        return name
