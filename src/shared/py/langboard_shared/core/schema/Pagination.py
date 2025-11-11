from fastapi import Query
from pydantic import BaseModel


class Pagination(BaseModel):
    page: int = Query(default=1, ge=1)
    limit: int = Query(default=1, ge=1)
