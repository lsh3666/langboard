from fastapi import Query
from pydantic import BaseModel
from ..types import SafeDateTime


class Pagination(BaseModel):
    page: int = Query(default=1, ge=1)
    limit: int = Query(default=1, ge=1)


class TimeBasedPagination(Pagination):
    refer_time: SafeDateTime = SafeDateTime.now()
