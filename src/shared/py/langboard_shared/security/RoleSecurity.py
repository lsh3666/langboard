from typing import Any, TypeVar, cast
from sqlmodel.sql.expression import SelectOfScalar
from ..core.db import DbSession, SqlBuilder
from ..filter.RoleFilter import _RoleFinderFunc
from ..models.bases import BaseRoleModel


_TRoleModel = TypeVar("_TRoleModel", bound=BaseRoleModel)


class RoleSecurity:
    def __init__(self, model_class: type[_TRoleModel]):
        self._model_class = model_class

    async def is_authorized(
        self,
        user_id: int,
        path_params: dict[str, Any],
        actions: list[str],
        role_finder: _RoleFinderFunc[_TRoleModel],
    ) -> bool:
        query = SqlBuilder.select.table(self._model_class).where(self._model_class.column("user_id") == user_id)

        query = role_finder(cast(SelectOfScalar[_TRoleModel], query), path_params, user_id)

        role = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(query.limit(1))
            role = result.first()

        if not role or not role.actions:
            return False
        return role.is_granted(actions)
