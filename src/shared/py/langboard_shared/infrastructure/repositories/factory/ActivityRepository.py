from typing import Any, Literal, TypeVar, cast, overload
from sqlmodel.sql.expression import Select, SelectOfScalar
from ....core.db import BaseSqlModel, DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.schema import TimeBasedPagination
from ....core.types import SafeDateTime, SnowflakeID
from ....core.types.ParamTypes import TCardParam, TColumnParam, TProjectParam, TUserOrBotParam, TUserParam, TWikiParam
from ....domain.models import Bot, ProjectActivity, ProjectWikiActivity, User, UserActivity
from ....domain.models.bases import BaseActivityModel
from ....helpers import InfraHelper


_TActivityModel = TypeVar("_TActivityModel", bound=BaseActivityModel)
_TSelectParam = TypeVar("_TSelectParam", bound=Any)
_TActivityScope = Literal["project", "project_column", "card", "project_wiki"]


class ActivityRepository(BaseRepository):
    @staticmethod
    def name() -> str:
        return "activity"

    @overload
    def get_list_by_user(
        self, user: TUserParam, pagination: TimeBasedPagination, only_count: Literal[False] = False
    ) -> tuple[list[UserActivity], int]: ...
    @overload
    def get_list_by_user(self, user: TUserParam, pagination: TimeBasedPagination, only_count: Literal[True]) -> int: ...
    def get_list_by_user(
        self, user: TUserParam, pagination: TimeBasedPagination, only_count: bool = False
    ) -> tuple[list[UserActivity], int] | int:
        user_id = InfraHelper.convert_id(user)

        if only_count:
            return self.__count_new_records(UserActivity, pagination.refer_time, user_id=user_id)

        result = self.__get_list(UserActivity, pagination, user_id=user_id)
        return result

    @overload
    def get_list_by_project(
        self,
        project: TProjectParam,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[ProjectActivity], int]: ...
    @overload
    def get_list_by_project(
        self,
        project: TProjectParam,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        *,
        assignee: TUserOrBotParam,
    ) -> tuple[list[UserActivity], int]: ...
    @overload
    def get_list_by_project(
        self,
        project: TProjectParam,
        pagination: TimeBasedPagination,
        only_count: Literal[True],
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    def get_list_by_project(
        self,
        project: TProjectParam,
        pagination: TimeBasedPagination,
        only_count: bool = False,
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[ProjectActivity] | list[UserActivity], int] | int:
        project_id = InfraHelper.convert_id(project)

        activity_class, list_query, outdated_query, where_clauses = self.__create_refer_activity_queries(
            ProjectActivity, "project", assignee=assignee, project=project_id
        )
        if not where_clauses:
            where_clauses = {"project_id": project_id}

        if only_count:
            return self.__count_new_records(activity_class, pagination.refer_time, outdated_query, **where_clauses)

        result = self.__get_list(activity_class, pagination, list_query, outdated_query, **where_clauses)
        return result

    @overload
    def get_list_by_column(
        self,
        project: TProjectParam,
        column: TColumnParam,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[ProjectActivity], int]: ...
    @overload
    def get_list_by_column(
        self,
        project: TProjectParam,
        column: TColumnParam,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        *,
        assignee: TUserOrBotParam,
    ) -> tuple[list[UserActivity], int]: ...
    @overload
    def get_list_by_column(
        self,
        project: TProjectParam,
        column: TColumnParam,
        pagination: TimeBasedPagination,
        only_count: Literal[True],
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    def get_list_by_column(
        self,
        project: TProjectParam,
        column: TColumnParam,
        pagination: TimeBasedPagination,
        only_count: bool = False,
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[ProjectActivity] | list[UserActivity], int] | int:
        project_id = InfraHelper.convert_id(project)
        column_id = InfraHelper.convert_id(column)

        activity_class, list_query, outdated_query, where_clauses = self.__create_refer_activity_queries(
            ProjectActivity, "project", assignee=assignee, project=project_id, project_column=column_id
        )
        if not where_clauses:
            where_clauses = {"project_id": project_id, "column_id": column_id}

        if only_count:
            return self.__count_new_records(activity_class, pagination.refer_time, outdated_query, **where_clauses)

        result = self.__get_list(activity_class, pagination, list_query, outdated_query, **where_clauses)
        return result

    @overload
    def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[ProjectActivity], int]: ...
    @overload
    def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        *,
        assignee: TUserOrBotParam,
    ) -> tuple[list[UserActivity], int]: ...
    @overload
    def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: TimeBasedPagination,
        only_count: Literal[True],
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: TimeBasedPagination,
        only_count: bool = False,
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[ProjectActivity] | list[UserActivity], int] | int:
        project_id = InfraHelper.convert_id(project)
        card_id = InfraHelper.convert_id(card)

        activity_class, list_query, outdated_query, where_clauses = self.__create_refer_activity_queries(
            ProjectActivity, "project", assignee=assignee, project=project_id, card=card_id
        )
        if not where_clauses:
            where_clauses = {"project_id": project_id, "card_id": card_id}

        if only_count:
            return self.__count_new_records(activity_class, pagination.refer_time, outdated_query, **where_clauses)

        result = self.__get_list(activity_class, pagination, cast(Any, list_query), outdated_query, **where_clauses)
        return result

    @overload
    def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[ProjectWikiActivity], int]: ...
    @overload
    def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        *,
        assignee: TUserOrBotParam,
    ) -> tuple[list[UserActivity], int]: ...
    @overload
    def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: TimeBasedPagination,
        only_count: Literal[True],
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: TimeBasedPagination,
        only_count: bool = False,
        *,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[ProjectWikiActivity] | list[UserActivity], int] | int:
        project_id = InfraHelper.convert_id(project)
        wiki_id = InfraHelper.convert_id(wiki)

        activity_class, list_query, outdated_query, where_clauses = self.__create_refer_activity_queries(
            ProjectWikiActivity, "project", assignee=assignee, project=project_id, project_wiki=wiki_id
        )
        if not where_clauses:
            where_clauses = {"project_id": project_id, "project_wiki_id": wiki_id}

        if only_count:
            return self.__count_new_records(activity_class, pagination.refer_time, outdated_query, **where_clauses)

        result = self.__get_list(activity_class, pagination, cast(Any, list_query), outdated_query, **where_clauses)
        return result

    def get_user_or_bot(self, user_or_bot_param: TUserOrBotParam) -> User | Bot | None:
        user_or_bot = InfraHelper.get_by_id_like(User, user_or_bot_param)
        if not user_or_bot:
            user_or_bot = InfraHelper.get_by_id_like(Bot, user_or_bot_param)
        return user_or_bot

    def __get_list(
        self,
        activity_class: type[_TActivityModel],
        pagination: TimeBasedPagination,
        list_query: Select[_TActivityModel] | SelectOfScalar[_TActivityModel] | None = None,
        outdated_query: SelectOfScalar[int] | None = None,
        **where_clauses,
    ) -> tuple[list[_TActivityModel], int]:
        if list_query is None:
            list_query = SqlBuilder.select.table(activity_class)
        list_query = self.__make_query(list_query, activity_class, **where_clauses)
        list_query = list_query.where(activity_class.column("created_at") <= pagination.refer_time)
        list_query = InfraHelper.paginate(list_query, pagination.page, pagination.limit)
        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(list_query)
            records = result.all()

        count_new_records = self.__count_new_records(
            activity_class, pagination.refer_time, outdated_query, **where_clauses
        )

        return records, count_new_records

    def __count_new_records(
        self,
        activity_class: type[_TActivityModel],
        refer_time: SafeDateTime,
        outdated_query: SelectOfScalar[int] | None = None,
        **where_clauses,
    ) -> int:
        if outdated_query is None:
            outdated_query = SqlBuilder.select.count(activity_class, activity_class.column("id"))
        outdated_query = self.__make_query(outdated_query, activity_class, **where_clauses)
        outdated_query = outdated_query.where(activity_class.column("created_at") > refer_time)
        record = 0
        with DbSession.use(readonly=True) as db:
            result = db.exec(outdated_query)
            record = result.first() or 0
        return record

    @overload
    def __make_query(
        self,
        query: Select[_TSelectParam],
        activity_class: type[_TActivityModel],
        **where_clauses,
    ) -> Select[_TSelectParam]: ...
    @overload
    def __make_query(
        self,
        query: SelectOfScalar[_TSelectParam],
        activity_class: type[_TActivityModel],
        **where_clauses,
    ) -> SelectOfScalar[_TSelectParam]: ...
    def __make_query(
        self,
        query: Select[_TSelectParam] | SelectOfScalar[_TSelectParam],
        activity_class: type[_TActivityModel],
        **where_clauses,
    ):
        query = query.order_by(activity_class.column("created_at").desc()).group_by(
            activity_class.column("id"), activity_class.column("created_at")
        )
        query = InfraHelper.where_recursive(query, activity_class, **where_clauses)
        return query

    @overload
    def __create_refer_activity_queries(
        self,
        activity_class: type[_TActivityModel],
        scope: _TActivityScope,
        *,
        assignee: TUserOrBotParam | None = None,
        **kwargs,
    ) -> tuple[type[_TActivityModel], None, None, None]: ...
    @overload
    def __create_refer_activity_queries(
        self,
        activity_class: type[_TActivityModel],
        scope: _TActivityScope,
        *,
        assignee: TUserOrBotParam | None = None,
        **kwargs,
    ) -> tuple[type[UserActivity], SelectOfScalar[UserActivity], SelectOfScalar[int], dict]: ...
    def __create_refer_activity_queries(
        self,
        activity_class: type[_TActivityModel],
        scope: _TActivityScope,
        *,
        assignee: TUserOrBotParam | None = None,
        **kwargs,
    ):
        if not assignee:
            return activity_class, None, None, None

        assignee = self.get_user_or_bot(assignee)
        if not assignee:
            return activity_class, None, None, None

        list_query = self.__refer(SqlBuilder.select.table(UserActivity), scope, **kwargs)
        outdated_query = self.__refer(SqlBuilder.select.count(UserActivity, UserActivity.column("id")), scope, **kwargs)
        where_clauses = {}

        if isinstance(assignee, User):
            where_clauses["user_id"] = assignee.id
        else:
            where_clauses["bot_id"] = assignee.id

        return UserActivity, list_query, outdated_query, where_clauses

    @overload
    def __refer(self, query: Select[_TActivityModel], scope: _TActivityScope, **kwargs) -> Select[_TActivityModel]: ...
    @overload
    def __refer(
        self, query: SelectOfScalar[_TActivityModel], scope: _TActivityScope, **kwargs
    ) -> SelectOfScalar[_TActivityModel]: ...
    @overload
    def __refer(self, query: SelectOfScalar[int], scope: _TActivityScope, **kwargs) -> SelectOfScalar[int]: ...
    def __refer(
        self,
        query: Select[_TActivityModel] | SelectOfScalar[_TActivityModel] | SelectOfScalar[int],
        scope: _TActivityScope,
        **kwargs,
    ) -> Select[_TActivityModel] | SelectOfScalar[_TActivityModel] | SelectOfScalar[int]:
        tables = []
        if scope in {"project", "project_wiki"}:
            query = query.outerjoin(
                ProjectActivity,
                (UserActivity.column("refer_activity_table") == ProjectActivity.__tablename__)
                & (ProjectActivity.column("id") == UserActivity.column("refer_activity_id")),
            ).outerjoin(
                ProjectWikiActivity,
                (UserActivity.column("refer_activity_table") == ProjectWikiActivity.__tablename__)
                & (ProjectWikiActivity.column("id") == UserActivity.column("refer_activity_id")),
            )
            tables = [ProjectActivity, ProjectWikiActivity]
        elif scope in {"project_column", "card"}:
            query = query.outerjoin(
                ProjectActivity,
                (UserActivity.column("refer_activity_table") == ProjectActivity.__tablename__)
                & (ProjectActivity.column("id") == UserActivity.column("refer_activity_id")),
            )
            tables = [ProjectActivity]

        for key, value in kwargs.items():
            if not isinstance(value, (BaseSqlModel, SnowflakeID, str, int)):
                continue

            value = InfraHelper.convert_id(value)
            key = f"{key}_id"

            or_clauses = None
            for table in tables:
                if key not in table.model_fields:
                    continue

                if or_clauses is None:
                    or_clauses = table.column(key) == value
                else:
                    or_clauses |= table.column(key) == value

            if or_clauses is not None:
                query = query.where(or_clauses)

        return query
