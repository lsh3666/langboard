from abc import ABC
from typing import Generic, TypeVar
from ....core.db import DbSession, SqlBuilder
from ....models.bases import BaseRoleModel


_TRoleModel = TypeVar("_TRoleModel", bound=BaseRoleModel)


class BaseRoleService(ABC, Generic[_TRoleModel]):
    def __init__(self, model_class: type[_TRoleModel]):
        self._model_class = model_class

    async def get_list(self, **kwargs) -> list[_TRoleModel]:
        """Get roles by filtering with the given parameters.

        If the given parameters are not in the model's fields or are `None`, they will be ignored.

        If no parameters are given, all roles will be returned.
        """
        query = SqlBuilder.select.table(self._model_class)

        for arg, value in kwargs.items():
            if arg in self._model_class.model_fields and value is not None:
                query = query.where(getattr(self._model_class, arg) == value)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            records = result.all()
        return records

    async def get_one(self, **kwargs) -> _TRoleModel | None:
        """Get a role by filtering with the given parameters.

        If the given parameters are not in the model's fields or are `None`, they will be ignored.

        If no parameters are given, all roles will be returned.
        """
        query = SqlBuilder.select.table(self._model_class)

        for arg, value in kwargs.items():
            if arg in self._model_class.model_fields and value is not None:
                query = query.where(getattr(self._model_class, arg) == value)

        record = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(query.limit(1))
            record = result.first()
        return record

    async def grant(self, **kwargs) -> _TRoleModel:
        """Grant actions to the role.

        If `user_id` aren't provided, a `ValueError` will be raised.

        After the method is executed, db must be committed to save the changes.
        """
        role = await self._get_or_create_role(**kwargs)
        if not role.is_new():
            role.actions = kwargs.get("actions", role.actions)

        with DbSession.use(readonly=False) as db:
            if role.is_new():
                db.insert(role)
            else:
                db.update(role)

        return role

    async def grant_all(self, **kwargs) -> _TRoleModel:
        """Grant all actions to the role. :meth:`BaseRoleModel.set_all_actions` will be called.

        If `user_id` aren't provided, a `ValueError` will be raised.

        After the method is executed, db must be committed to save the changes.
        """
        role = await self._get_or_create_role(**kwargs)
        role.set_all_actions()

        with DbSession.use(readonly=False) as db:
            if role.is_new():
                db.insert(role)
            else:
                db.update(role)

        return role

    async def grant_default(self, **kwargs) -> _TRoleModel:
        """Grant default actions to the role. :meth:`BaseRoleModel.set_default_actions` will be called.

        If `user_id` aren't provided, a `ValueError` will be raised.

        After the method is executed, db must be committed to save the changes.
        """
        role = await self._get_or_create_role(**kwargs)
        role.set_default_actions()

        with DbSession.use(readonly=False) as db:
            if role.is_new():
                db.insert(role)
            else:
                db.update(role)

        return role

    async def withdraw(self, **kwargs) -> _TRoleModel | None:
        """Withdraw the role.

        If `user_id` aren't provided, a `ValueError` will be raised.

        After the method is executed, db must be committed to save the changes.
        """
        role = await self._get_or_create_role(**kwargs)
        if role.is_new():
            return None

        with DbSession.use(readonly=False) as db:
            db.delete(role)

        return role

    async def _get_or_create_role(self, **kwargs) -> _TRoleModel:
        if kwargs.get("user_id", None) is not None:
            target_id_column = self._model_class.user_id
            target_id = kwargs["user_id"]
        else:
            raise ValueError("user_id must be provided.")

        query = SqlBuilder.select.table(self._model_class).where(target_id_column == target_id)
        filterable_columns = self._model_class.get_filterable_columns()
        for arg, value in kwargs.items():
            if arg in filterable_columns and value is not None:
                query = query.where(self._model_class.column(arg) == value)

        role = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(query.limit(1))
            role = result.first()
        return self._model_class(**kwargs) if not role else role
