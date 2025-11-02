from typing import Any, Literal, Mapping, Optional, Sequence, TypeGuard, TypeVar, cast, overload
from sqlalchemy import Column, func
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.sql._typing import _DMLTableArgument
from sqlmodel import select
from sqlmodel.sql._expression_select_gen import _TCCA
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...types import SafeDateTime, SnowflakeID
from ..Models import SoftDeleteModel


_T0 = TypeVar("_T0")
_T1 = TypeVar("_T1")
_T2 = TypeVar("_T2")
_T3 = TypeVar("_T3")
_T4 = TypeVar("_T4")
_T5 = TypeVar("_T5")
_T6 = TypeVar("_T6")
_T7 = TypeVar("_T7")
_T8 = TypeVar("_T8")
_T9 = TypeVar("_T9")

_TScalar_0 = TypeVar(
    "_TScalar_0", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_1 = TypeVar(
    "_TScalar_1", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_2 = TypeVar(
    "_TScalar_2", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_3 = TypeVar(
    "_TScalar_3", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_4 = TypeVar(
    "_TScalar_4", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_5 = TypeVar(
    "_TScalar_5", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_6 = TypeVar(
    "_TScalar_6", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_7 = TypeVar(
    "_TScalar_7", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_8 = TypeVar(
    "_TScalar_8", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)
_TScalar_9 = TypeVar(
    "_TScalar_9", Column, Sequence, Mapping, SnowflakeID, Optional[Any], SafeDateTime, float, int, bool, bytes, str
)


class SelectQuery:
    def table(self, entity: _TCCA[_T0], with_deleted: bool = False) -> SelectOfScalar[_T0]:
        statement: SelectOfScalar[_T0] = select(entity)
        if self._is_soft_delete_model(entity, is_column=False):
            soft_delete_models: set[type[SoftDeleteModel]] = set([entity])
            statement = self._set_where(statement, soft_delete_models, with_deleted)
        return statement

    @overload
    def tables(
        self, entity0: _TCCA[_T0], entity1: _TCCA[_T1], /, with_deleted: bool = False
    ) -> Select[tuple[_T0, _T1]]: ...
    @overload
    def tables(
        self, entity0: _TCCA[_T0], entity1: _TCCA[_T1], entity2: _TCCA[_T2], /, with_deleted: bool = False
    ) -> Select[tuple[_T0, _T1, _T2]]: ...
    @overload
    def tables(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_T0, _T1, _T2, _T3]]: ...
    @overload
    def tables(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        entity4: _TCCA[_T4],
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_T0, _T1, _T2, _T3, _T4]]: ...
    @overload
    def tables(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        entity4: _TCCA[_T4],
        entity5: _TCCA[_T5],
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_T0, _T1, _T2, _T3, _T4, _T5]]: ...
    @overload
    def tables(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        entity4: _TCCA[_T4],
        entity5: _TCCA[_T5],
        entity6: _TCCA[_T6],
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_T0, _T1, _T2, _T3, _T4, _T5, _T6]]: ...
    @overload
    def tables(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        entity4: _TCCA[_T4],
        entity5: _TCCA[_T5],
        entity6: _TCCA[_T6],
        entity7: _TCCA[_T7],
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_T0, _T1, _T2, _T3, _T4, _T5, _T6, _T7]]: ...
    @overload
    def tables(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        entity4: _TCCA[_T4],
        entity5: _TCCA[_T5],
        entity6: _TCCA[_T6],
        entity7: _TCCA[_T7],
        entity8: _TCCA[_T8],
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_T0, _T1, _T2, _T3, _T4, _T5, _T6, _T7, _T8]]: ...
    @overload
    def tables(
        self,
        entity0: _TCCA[_T0],
        entity1: _TCCA[_T1],
        entity2: _TCCA[_T2],
        entity3: _TCCA[_T3],
        entity4: _TCCA[_T4],
        entity5: _TCCA[_T5],
        entity6: _TCCA[_T6],
        entity7: _TCCA[_T7],
        entity8: _TCCA[_T8],
        entity9: _TCCA[_T9],
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_T0, _T1, _T2, _T3, _T4, _T5, _T6, _T7, _T8, _T9]]: ...
    def tables(self, *entities: _DMLTableArgument, with_deleted: bool = False) -> SelectOfScalar | Select:  # type: ignore
        statement: Select = select(*entities)  # type: ignore
        soft_delete_models: set[type[SoftDeleteModel]] = set(
            [entity for entity in entities if self._is_soft_delete_model(entity, is_column=False)]
        )

        return self._set_where(statement, soft_delete_models, with_deleted)

    def column(self, column0: _TScalar_0, with_deleted: bool = False) -> SelectOfScalar[_TScalar_0]:
        statement: SelectOfScalar[_TScalar_0] = select(cast(Any, column0))
        if self._is_soft_delete_model(column0, is_column=True):
            soft_delete_models: set = set([column0.class_])
            statement = self._set_where(statement, soft_delete_models, with_deleted)
        return statement

    @overload
    def columns(
        self, column0: _TScalar_0, column1: _TScalar_1, /, with_deleted: bool = False
    ) -> Select[tuple[_TScalar_0, _TScalar_1]]: ...
    @overload
    def columns(
        self, column0: _TScalar_0, column1: _TScalar_1, column2: _TScalar_2, /, with_deleted: bool = False
    ) -> Select[tuple[_TScalar_0, _TScalar_1, _TScalar_2]]: ...
    @overload
    def columns(
        self,
        column0: _TScalar_0,
        column1: _TScalar_1,
        column2: _TScalar_2,
        column3: _TScalar_3,
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_TScalar_0, _TScalar_1, _TScalar_2, _TScalar_3]]: ...
    @overload
    def columns(
        self,
        column0: _TScalar_0,
        column1: _TScalar_1,
        column2: _TScalar_2,
        column3: _TScalar_3,
        column4: _TScalar_4,
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_TScalar_0, _TScalar_1, _TScalar_2, _TScalar_3, _TScalar_4]]: ...
    @overload
    def columns(
        self,
        column0: _TScalar_0,
        column1: _TScalar_1,
        column2: _TScalar_2,
        column3: _TScalar_3,
        column4: _TScalar_4,
        column5: _TScalar_5,
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_TScalar_0, _TScalar_1, _TScalar_2, _TScalar_3, _TScalar_4, _TScalar_5]]: ...
    @overload
    def columns(
        self,
        column0: _TScalar_0,
        column1: _TScalar_1,
        column2: _TScalar_2,
        column3: _TScalar_3,
        column4: _TScalar_4,
        column5: _TScalar_5,
        column6: _TScalar_6,
        /,
        with_deleted: bool = False,
    ) -> Select[tuple[_TScalar_0, _TScalar_1, _TScalar_2, _TScalar_3, _TScalar_4, _TScalar_5, _TScalar_6]]: ...
    @overload
    def columns(
        self,
        column0: _TScalar_0,
        column1: _TScalar_1,
        column2: _TScalar_2,
        column3: _TScalar_3,
        column4: _TScalar_4,
        column5: _TScalar_5,
        column6: _TScalar_6,
        column7: _TScalar_7,
        /,
        with_deleted: bool = False,
    ) -> Select[
        tuple[_TScalar_0, _TScalar_1, _TScalar_2, _TScalar_3, _TScalar_4, _TScalar_5, _TScalar_6, _TScalar_7]
    ]: ...
    @overload
    def columns(
        self,
        column0: _TScalar_0,
        column1: _TScalar_1,
        column2: _TScalar_2,
        column3: _TScalar_3,
        column4: _TScalar_4,
        column5: _TScalar_5,
        column6: _TScalar_6,
        column7: _TScalar_7,
        column8: _TScalar_8,
        /,
        with_deleted: bool = False,
    ) -> Select[
        tuple[
            _TScalar_0, _TScalar_1, _TScalar_2, _TScalar_3, _TScalar_4, _TScalar_5, _TScalar_6, _TScalar_7, _TScalar_8
        ]
    ]: ...
    @overload
    def columns(
        self,
        column0: _TScalar_0,
        column1: _TScalar_1,
        column2: _TScalar_2,
        column3: _TScalar_3,
        column4: _TScalar_4,
        column5: _TScalar_5,
        column6: _TScalar_6,
        column7: _TScalar_7,
        column8: _TScalar_8,
        column9: _TScalar_9,
        /,
        with_deleted: bool = False,
    ) -> Select[
        tuple[
            _TScalar_0,
            _TScalar_1,
            _TScalar_2,
            _TScalar_3,
            _TScalar_4,
            _TScalar_5,
            _TScalar_6,
            _TScalar_7,
            _TScalar_8,
            _TScalar_9,
        ]
    ]: ...
    def columns(self, *entities: _DMLTableArgument, with_deleted: bool = False) -> Select | SelectOfScalar:  # type: ignore
        statement: Select | SelectOfScalar = select(*entities)  # type: ignore
        soft_delete_models: set = set(
            [entity.class_ for entity in entities if self._is_soft_delete_model(entity, is_column=True)]
        )

        return self._set_where(statement, soft_delete_models, with_deleted)

    @overload
    def count(self, entity: Select[_T0], column: _TScalar_0) -> SelectOfScalar[int]: ...
    @overload
    def count(self, entity: SelectOfScalar[_T0], column: _TScalar_0) -> SelectOfScalar[int]: ...
    @overload
    def count(self, entity: _TCCA[_T0], column: _TScalar_0) -> SelectOfScalar[int]: ...
    def count(self, entity: Select | SelectOfScalar | _TCCA, column: _DMLTableArgument) -> SelectOfScalar[int]:  # type: ignore
        if isinstance(entity, Select) or isinstance(entity, SelectOfScalar):
            return entity.with_only_columns(func.count(column))  # type: ignore

        return select(func.count(column))  # type: ignore

    @overload
    def _is_soft_delete_model(
        self, entity: Any, is_column: Literal[True]
    ) -> TypeGuard[type[InstrumentedAttribute[SoftDeleteModel]]]: ...
    @overload
    def _is_soft_delete_model(self, entity: Any, is_column: Literal[False]) -> TypeGuard[type[SoftDeleteModel]]: ...
    def _is_soft_delete_model(self, entity: Any, is_column: bool) -> TypeGuard[type]:
        return (isinstance(entity, type) and issubclass(entity, SoftDeleteModel)) or (
            isinstance(entity, InstrumentedAttribute)
            and isinstance(entity.class_, type)
            and issubclass(entity.class_, SoftDeleteModel)
        )

    @overload
    def _set_where(
        self, statement: Select, models: set[type[SoftDeleteModel]], with_deleted: bool = False
    ) -> Select: ...
    @overload
    def _set_where(
        self, statement: SelectOfScalar, models: set[type[SoftDeleteModel]], with_deleted: bool = False
    ) -> SelectOfScalar: ...
    def _set_where(
        self, statement: Select | SelectOfScalar, models: set[type[SoftDeleteModel]], with_deleted: bool = False
    ) -> Select | SelectOfScalar:
        if not with_deleted and models:
            for entity in models:
                statement = statement.where(entity.deleted_at == None)  # noqa
        return statement
