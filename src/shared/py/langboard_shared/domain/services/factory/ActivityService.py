from typing import Any, Literal, cast, overload
from ....core.db import BaseSqlModel
from ....core.domain import BaseDomainService
from ....core.schema import TimeBasedPagination
from ....core.types.ParamTypes import TCardParam, TColumnParam, TProjectParam, TUserOrBotParam, TUserParam, TWikiParam
from ....domain.models import (
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
from ....domain.models.bases import BaseActivityModel
from ....helpers import InfraHelper


class ActivityService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "activity"

    @overload
    async def get_api_list_by_user(
        self, user: TUserParam | None, pagination: TimeBasedPagination
    ) -> tuple[list[dict[str, Any]], int, User] | None: ...
    @overload
    async def get_api_list_by_user(
        self, user: TUserParam | None, pagination: TimeBasedPagination, only_count: Literal[True]
    ) -> int: ...
    async def get_api_list_by_user(
        self, user: TUserParam | None, pagination: TimeBasedPagination, only_count: bool = False
    ) -> tuple[list[dict[str, Any]], int, User] | int | None:
        user = InfraHelper.get_by_id_like(User, user)
        if not user:
            if only_count:
                return 0
            return None

        if only_count:
            return self.repo.activity.get_list_by_user(user, pagination, only_count=True)

        activities, count_new_records = self.repo.activity.get_list_by_user(user, pagination, only_count=False)

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
    async def get_api_list_by_project(
        self,
        project: TProjectParam | None,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project] | None: ...
    @overload
    async def get_api_list_by_project(
        self,
        project: TProjectParam | None,
        pagination: TimeBasedPagination,
        only_count: Literal[True],
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    async def get_api_list_by_project(
        self,
        project: TProjectParam | None,
        pagination: TimeBasedPagination,
        only_count: bool = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project] | int | None:
        project = InfraHelper.get_by_id_like(Project, project)
        if not project:
            if only_count:
                return 0
            return None

        if only_count:
            return self.repo.activity.get_list_by_project(project, pagination, only_count=True, assignee=assignee)

        activities, count_new_records = self.repo.activity.get_list_by_project(
            project, pagination, only_count=False, assignee=assignee
        )

        if assignee:
            api_activities = await self.__convert_api_response(cast(Any, activities))
        else:
            api_activities = [activity.api_response() for activity in activities]

        return api_activities, count_new_records, project

    @overload
    async def get_api_list_by_column(
        self,
        project: TProjectParam | None,
        column: TColumnParam | None,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectColumn] | None: ...
    @overload
    async def get_api_list_by_column(
        self,
        project: TProjectParam | None,
        column: TColumnParam | None,
        pagination: TimeBasedPagination,
        only_count: Literal[True],
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    async def get_api_list_by_column(
        self,
        project: TProjectParam | None,
        column: TColumnParam | None,
        pagination: TimeBasedPagination,
        only_count: bool = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectColumn] | int | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
        if not params:
            if only_count:
                return 0
            return None
        project, column = params

        if only_count:
            return self.repo.activity.get_list_by_column(
                project, column, pagination, only_count=True, assignee=assignee
            )

        activities, count_new_records = self.repo.activity.get_list_by_column(
            project, column, pagination, only_count=False, assignee=assignee
        )

        if assignee:
            api_activities = await self.__convert_api_response(cast(Any, activities))
        else:
            api_activities = [activity.api_response() for activity in activities]

        return api_activities, count_new_records, project, column

    @overload
    async def get_api_list_by_card(
        self,
        project: TProjectParam | None,
        card: TCardParam | None,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, Card] | None: ...
    @overload
    async def get_api_list_by_card(
        self,
        project: TProjectParam | None,
        card: TCardParam | None,
        pagination: TimeBasedPagination,
        only_count: Literal[True],
        assignee: TUserOrBotParam | None = None,
    ) -> int: ...
    async def get_api_list_by_card(
        self,
        project: TProjectParam | None,
        card: TCardParam | None,
        pagination: TimeBasedPagination,
        only_count: bool = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, Card] | int | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            if only_count:
                return 0
            return None
        project, card = params

        if only_count:
            return self.repo.activity.get_list_by_card(project, card, pagination, only_count=True, assignee=assignee)

        activities, count_new_records = self.repo.activity.get_list_by_card(
            project, card, pagination, only_count=False, assignee=assignee
        )

        if assignee:
            api_activities = await self.__convert_api_response(cast(Any, activities))
        else:
            api_activities = [activity.api_response() for activity in activities]

        return api_activities, count_new_records, project, card

    @overload
    async def get_api_list_by_wiki(
        self,
        project: TProjectParam | None,
        wiki: TWikiParam | None,
        pagination: TimeBasedPagination,
        only_count: Literal[False] = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectWiki] | None: ...
    @overload
    async def get_api_list_by_wiki(
        self,
        project: TProjectParam | None,
        wiki: TWikiParam | None,
        pagination: TimeBasedPagination,
        only_count: Literal[True],
        assignee: TUserOrBotParam | None = None,
    ) -> int | None: ...
    async def get_api_list_by_wiki(
        self,
        project: TProjectParam | None,
        wiki: TWikiParam | None,
        pagination: TimeBasedPagination,
        only_count: bool = False,
        assignee: TUserOrBotParam | None = None,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectWiki] | int | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
        if not params:
            if only_count:
                return 0
            return None
        project, wiki = params

        if only_count:
            return self.repo.activity.get_list_by_wiki(project, wiki, pagination, only_count=True, assignee=assignee)

        activities, count_new_records = self.repo.activity.get_list_by_wiki(
            project, wiki, pagination, only_count=False, assignee=assignee
        )

        if assignee:
            api_activities = await self.__convert_api_response(cast(Any, activities))
        else:
            api_activities = [activity.api_response() for activity in activities]

        return api_activities, count_new_records, project, wiki

    def get_user_or_bot(self, user_or_bot_param: TUserOrBotParam) -> User | Bot | None:
        return self.repo.activity.get_user_or_bot(user_or_bot_param)

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
        refer_activities = InfraHelper.get_references(
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

        cached_references = InfraHelper.get_references(refer_activity_reference_ids, as_type="raw", with_deleted=True)
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
