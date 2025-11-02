from sqlalchemy import Delete
from sqlalchemy.sql._typing import _DMLTableArgument
from sqlmodel import delete
from ..Models import BaseSqlModel


class DeleteQuery:
    def table(self, table: _DMLTableArgument) -> Delete:
        if not isinstance(table, type) or not issubclass(table, BaseSqlModel):
            raise ValueError("Table must be a subclass of BaseSqlModel")

        return delete(table)
