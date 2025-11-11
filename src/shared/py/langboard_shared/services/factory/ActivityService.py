from typing import Any, Literal, TypeVar, cast, overload
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...core.db import DbSession, SqlBuilder
from ...core.db.Models import BaseSqlModel
from ...core.schema import Pagination
from ...core.service import BaseService
from ...core.types import SafeDateTime, SnowflakeID
from ...helpers import ServiceHelper
from ...models import (
    Bot,
    Card,
    Project,
    ProjectActivity,
    ProjectColumn,
    ProjectWiki,
    ProjectWikiActivity,
    User,
    UserActivity,
)
from ...models.bases import BaseActivityModel
from .Types import TCardParam, TColumnParam, TProjectParam, TUserOrBotParam, TUserParam, TWikiParam


_TActivityModel = TypeVar("_TActivityModel", bound=BaseActivityModel)
_TSelectParam = TypeVar("_TSelectParam", bound=Any)
_TActivityScope = Literal["project", "project_column", "card", "project_wiki"]


class ActivityService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "activity"

    @overload
    async def get_list_by_user(
        self, user: TUserParam, pagination: Pagination, refer_time: SafeDateTime
    ) -> tuple[list[dict[str, Any]], int, User] | None: ...
    @overload
    async def get_list_by_user(
        self,
        user: TUserParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[True],
    ) -> int | None: ...
    async def get_list_by_user(
        self,
        user: TUserParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: bool = False,
    ) -> tuple[list[dict[str, Any]], int, User] | int | None:
        user = ServiceHelper.get_by_param(User, user)
        if not user:
            if only_count:
                return 0
            return None

        if only_count:
            return await self.__count_new_records(UserActivity, refer_time, user_id=user.id)

        activities, count_new_records = await self.__get_list(UserActivity, pagination, refer_time, user_id=user.id)
        api_activties = []
        cached_dict = await self.__get_cached_references(activities)
        for activity in activities:
            if not activity.refer_activity_id or not activity.refer_activity_table:
                continue

            if activity.id not in cached_dict:
                continue

            api_activity = {
                **activity.api_response(),
                **cached_dict[activity.id],
            }
            api_activties.append(api_activity)

        return api_activties, count_new_records, user

    @overload
    async def get_list_by_project(
        self,
        project: TProjectParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[False] = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project] | None: ...
    @overload
    async def get_list_by_project(
        self,
        project: TProjectParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[True],
        assignee: TUserOrBotParam | None = None,
    ) -> int | None: ...
    async def get_list_by_project(
        self,
        project: TProjectParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: bool = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project] | int | None:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return None

        activity_class, list_query, outdated_query, where_clauses = self.__create_refer_activity_queries(
            ProjectActivity, "project", assignee, project=project
        )
        if not where_clauses:
            where_clauses = {"project_id": project.id}

        if only_count:
            return await self.__count_new_records(activity_class, refer_time, outdated_query, **where_clauses)

        activities, count_new_records = await self.__get_list(
            activity_class, pagination, refer_time, cast(Any, list_query), outdated_query, **where_clauses
        )

        if activity_class is UserActivity:
            api_activities = await self.__convert_api_response(cast(Any, activities))
        else:
            api_activities = [activity.api_response() for activity in activities]

        return (
            api_activities,
            count_new_records,
            project,
        )

    @overload
    async def get_list_by_column(
        self,
        project: TProjectParam,
        column: TColumnParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[False] = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectColumn] | None: ...
    @overload
    async def get_list_by_column(
        self,
        project: TProjectParam,
        column: TColumnParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[True],
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    async def get_list_by_column(
        self,
        project: TProjectParam,
        column: TColumnParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: bool = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectColumn] | int | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
        if not params:
            return None
        project, column = params

        activity_class, list_query, outdated_query, where_clauses = self.__create_refer_activity_queries(
            ProjectActivity, "project", assignee, project=project, project_column=column
        )
        if not where_clauses:
            where_clauses = {"project_id": project.id, "column_id": column.id}

        if only_count:
            return await self.__count_new_records(activity_class, refer_time, outdated_query, **where_clauses)

        activities, count_new_records = await self.__get_list(
            activity_class, pagination, refer_time, cast(Any, list_query), outdated_query, **where_clauses
        )

        if activity_class is UserActivity:
            api_activities = await self.__convert_api_response(cast(Any, activities))
        else:
            api_activities = [activity.api_response() for activity in activities]

        return (
            api_activities,
            count_new_records,
            project,
            column,
        )

    @overload
    async def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[False] = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, Card] | None: ...
    @overload
    async def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[True],
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    async def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: bool = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, Card] | int | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        activity_class, list_query, outdated_query, where_clauses = self.__create_refer_activity_queries(
            ProjectActivity, "project", assignee, project=project, card=card
        )
        if not where_clauses:
            where_clauses = {"project_id": project.id, "card_id": card.id}

        if only_count:
            return await self.__count_new_records(activity_class, refer_time, outdated_query, **where_clauses)

        activities, count_new_records = await self.__get_list(
            activity_class, pagination, refer_time, cast(Any, list_query), outdated_query, **where_clauses
        )

        if activity_class is UserActivity:
            api_activities = await self.__convert_api_response(cast(Any, activities))
        else:
            api_activities = [activity.api_response() for activity in activities]

        return (
            api_activities,
            count_new_records,
            project,
            card,
        )

    @overload
    async def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[False] = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectWiki] | None: ...
    @overload
    async def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: Literal[True],
        assignee: TUserOrBotParam | None = None,
    ) -> int | None: ...
    async def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: Pagination,
        refer_time: SafeDateTime,
        only_count: bool = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectWiki] | int | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
        if not params:
            return None
        project, wiki = params

        activity_class, list_query, outdated_query, where_clauses = self.__create_refer_activity_queries(
            ProjectWikiActivity, "project", assignee, project=project, project_wiki=wiki
        )
        if not where_clauses:
            where_clauses = {"project_id": project.id, "project_wiki_id": wiki.id}

        if only_count:
            return await self.__count_new_records(activity_class, refer_time, outdated_query, **where_clauses)

        activities, count_new_records = await self.__get_list(
            activity_class, pagination, refer_time, cast(Any, list_query), outdated_query, **where_clauses
        )

        if activity_class is UserActivity:
            api_activities = await self.__convert_api_response(cast(Any, activities))
        else:
            api_activities = [activity.api_response() for activity in activities]

        return (
            api_activities,
            count_new_records,
            project,
            wiki,
        )

    def get_user_or_bot(self, user_or_bot_param: TUserOrBotParam) -> User | Bot | None:
        user_or_bot = ServiceHelper.get_by_param(User, user_or_bot_param)
        if not user_or_bot:
            user_or_bot = ServiceHelper.get_by_param(Bot, user_or_bot_param)
        return user_or_bot

    async def __get_list(
        self,
        activity_class: type[_TActivityModel],
        pagination: Pagination,
        refer_time: SafeDateTime,
        list_query: Select[_TActivityModel] | SelectOfScalar[_TActivityModel] | None = None,
        outdated_query: SelectOfScalar[int] | None = None,
        **where_clauses,
    ) -> tuple[list[_TActivityModel], int]:
        if list_query is None:
            list_query = SqlBuilder.select.table(activity_class)
        list_query = self.__make_query(list_query, activity_class, **where_clauses)
        list_query = list_query.where(activity_class.column("created_at") <= refer_time)
        list_query = ServiceHelper.paginate(list_query, pagination.page, pagination.limit)
        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(list_query)
            records = result.all()

        count_new_records = await self.__count_new_records(activity_class, refer_time, outdated_query, **where_clauses)

        return records, count_new_records

    async def __count_new_records(
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
        query = ServiceHelper.where_recursive(query, activity_class, **where_clauses)
        return query

    def __create_refer_activity_queries(
        self,
        activity_class: type[_TActivityModel],
        scope: _TActivityScope,
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
            if not isinstance(value, (BaseSqlModel, SnowflakeID, int)):
                continue

            value = ServiceHelper.convert_id(value)
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

    async def __convert_api_response(self, activities: list[UserActivity]) -> list[dict[str, Any]]:
        api_activties = []
        cached_dict = await self.__get_cached_references(activities)
        for activity in activities:
            if not activity.refer_activity_id or not activity.refer_activity_table:
                continue

            if activity.id not in cached_dict:
                continue

            api_activity = {
                **activity.api_response(),
                **cached_dict[activity.id],
            }
            api_activties.append(api_activity)
        return api_activties

    async def __get_cached_references(self, activities: list[UserActivity]):
        refer_activities = ServiceHelper.get_references(
            [
                (activity.refer_activity_table, activity.refer_activity_id)
                for activity in activities
                if activity.refer_activity_table and activity.refer_activity_id
            ],
            as_type="raw",
        )
        refer_activity_reference_ids: list[tuple[str, int]] = []
        for refer_activity in refer_activities.values():
            if isinstance(refer_activity, ProjectActivity):
                refer_activity_reference_ids.append((Project.__tablename__, refer_activity.project_id))
                if refer_activity.card_id:
                    refer_activity_reference_ids.append((Card.__tablename__, refer_activity.card_id))
            elif isinstance(refer_activity, ProjectWikiActivity):
                refer_activity_reference_ids.append((Project.__tablename__, refer_activity.project_id))
                refer_activity_reference_ids.append((ProjectWiki.__tablename__, refer_activity.project_wiki_id))

        cached_references = ServiceHelper.get_references(refer_activity_reference_ids, as_type="raw", with_deleted=True)
        references = {}
        for activity in activities:
            if not activity.refer_activity_id or not activity.refer_activity_table:
                continue

            refer_activitiy_cache_key = f"{activity.refer_activity_table}_{activity.refer_activity_id}"
            if refer_activitiy_cache_key not in refer_activities:
                continue

            refer_activity = cast(BaseActivityModel, refer_activities[refer_activitiy_cache_key])
            activity_references = self.__get_converted_references(cached_references, refer_activity)
            if not activity_references:
                continue

            references[activity.id] = {
                "refer": refer_activity.api_response(),
                "references": activity_references,
            }
        return references

    def __get_converted_references(
        self, cached_references: dict[str, BaseSqlModel], activity: BaseActivityModel
    ) -> dict[str, Any] | None:
        activity_references = {}
        if isinstance(activity, (ProjectActivity, ProjectWikiActivity)) and activity.project_id:
            reference = cast(
                Project,
                cached_references.get(f"{Project.__tablename__}_{activity.project_id}"),
            )
            if not reference:
                return None
            activity_references["project"] = reference.api_response()
            if reference.deleted_at:
                activity_references["project"]["is_deleted"] = True

        if isinstance(activity, ProjectActivity) and activity.project_id:
            activity_references["refer_type"] = "project"
            if activity.card_id:
                reference = cast(
                    Card,
                    cached_references.get(f"{Card.__tablename__}_{activity.card_id}"),
                )
                if not reference:
                    return None
                activity_references["card"] = reference.api_response()
                if reference.deleted_at:
                    activity_references["card"]["is_deleted"] = True
        elif isinstance(activity, ProjectWikiActivity) and activity.project_id:
            activity_references["refer_type"] = "project_wiki"
            reference = cast(
                ProjectWiki,
                cached_references.get(f"{ProjectWiki.__tablename__}_{activity.project_wiki_id}"),
            )
            if not reference:
                return None
            activity_references["project_wiki"] = reference.api_response()
            if reference.deleted_at:
                activity_references["project_wiki"]["is_deleted"] = True

        if not activity_references:
            return None
        return activity_references
