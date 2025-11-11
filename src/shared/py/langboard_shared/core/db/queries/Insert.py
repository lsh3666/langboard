from sqlalchemy import Insert
from sqlalchemy.sql._typing import _DMLTableArgument
from sqlmodel import insert
from ..Models import BaseSqlModel


class InsertQuery:
    def table(self, table: _DMLTableArgument) -> Insert:
        if not isinstance(table, type) or not issubclass(table, BaseSqlModel):
            raise ValueError("Table must be a subclass of BaseSqlModel")

        return insert(table)
