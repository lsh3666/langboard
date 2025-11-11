from typing import Any, Generic, TypeVar
from pydantic import BaseModel


_TList = TypeVar("_TList", bound=Any)


class InfiniteRefreshableList(BaseModel, Generic[_TList]):
    records: list[_TList] = []
    count_new_records: int = 0

    @staticmethod
    def api_schema(list_schema: Any, other_schema: dict | None = None) -> dict[str, Any]:
        return {
            "records": [list_schema],
            "count_new_records": "integer",
            **(other_schema or {}),
        }
