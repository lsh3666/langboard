from typing import Any
from fastapi import Depends
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import AppRouter, JsonResponse
from langboard_shared.core.schema import InfiniteRefreshableList, OpenApiSchema
from langboard_shared.filter import RoleFilter
from langboard_shared.models import Bot, ProjectRole, ProjectWikiActivity, User, UserActivity
from langboard_shared.models.bases import BaseActivityModel
from langboard_shared.models.ProjectRole import ProjectRoleAction
from langboard_shared.security import Auth, RoleFinder
from langboard_shared.services import Service
from .ActivityForm import ActivityPagination


USER_ACTIVITY_SCHEMA = InfiniteRefreshableList.api_schema(
    (
        UserActivity,
        {
            "schema": {
                "refer?": BaseActivityModel,
                "references?": {"refer_type": "project", "<refer table>": "object"},
            }
        },
    )
)


def _create_project_activity_schema(
    activity: type[BaseActivityModel] = BaseActivityModel, references: dict | None = None
) -> dict[str, Any]:
    return InfiniteRefreshableList.api_schema(
        activity,
        {
            "references": {
                "project": {"uid": "string"},
                **(references or {}),
            }
        },
    )


@AppRouter.api.get(
    "/activity/user", tags=["Activity"], responses=OpenApiSchema().suc(USER_ACTIVITY_SCHEMA).auth().forbidden().get()
)
@AuthFilter.add("user")
async def get_current_user_activities(
    pagination: ActivityPagination = Depends(), user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    if pagination.only_count:
        result = await service.activity.get_list_by_user(user, pagination, pagination.refer_time, only_count=True)
        return JsonResponse(content={"count_new_records": result or 0})

    result = await service.activity.get_list_by_user(user, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content=InfiniteRefreshableList())
    activities, count_new_records, _ = result
    return JsonResponse(content=InfiniteRefreshableList(records=activities, count_new_records=count_new_records))


@AppRouter.api.get(
    "/activity/project/{project_uid}",
    tags=["Activity"],
    responses=(OpenApiSchema().suc(_create_project_activity_schema()).auth().forbidden().get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project_activities(
    project_uid: str,
    pagination: ActivityPagination = Depends(),
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    assignee = service.activity.get_user_or_bot(pagination.assignee_uid) if pagination.assignee_uid else None
    if not await _can_view_other_assignee_activities(project_uid, user, assignee, service):
        return JsonResponse(content=InfiniteRefreshableList())

    if pagination.only_count:
        result = await service.activity.get_list_by_project(
            project_uid, pagination, pagination.refer_time, only_count=True, assignee=assignee
        )
        return JsonResponse(content=InfiniteRefreshableList(count_new_records=result or 0))

    result = await service.activity.get_list_by_project(
        project_uid, pagination, pagination.refer_time, assignee=assignee
    )
    if not result:
        return JsonResponse(content=InfiniteRefreshableList())
    activities, count_new_records, project = result
    return JsonResponse(
        content={
            **InfiniteRefreshableList(records=activities, count_new_records=count_new_records).model_dump(),
            "references": {"project": {"uid": project.get_uid()}},
        }
    )


@AppRouter.api.get(
    "/activity/project/{project_uid}/column/{column_uid}",
    tags=["Activity"],
    responses=(
        OpenApiSchema()
        .suc(_create_project_activity_schema(references={"project_column": {"uid": "string"}}))
        .auth()
        .forbidden()
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project_column_activities(
    project_uid: str,
    column_uid: str,
    pagination: ActivityPagination = Depends(),
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    assignee = service.activity.get_user_or_bot(pagination.assignee_uid) if pagination.assignee_uid else None
    if not await _can_view_other_assignee_activities(project_uid, user, assignee, service):
        return JsonResponse(content=InfiniteRefreshableList())

    if pagination.only_count:
        result = await service.activity.get_list_by_column(
            project_uid, column_uid, pagination, pagination.refer_time, only_count=True, assignee=assignee
        )
        return JsonResponse(content=InfiniteRefreshableList(count_new_records=result or 0))

    result = await service.activity.get_list_by_column(
        project_uid, column_uid, pagination, pagination.refer_time, assignee=assignee
    )
    if not result:
        return JsonResponse(content=InfiniteRefreshableList())
    activities, count_new_records, project, column = result
    return JsonResponse(
        content={
            **InfiniteRefreshableList(records=activities, count_new_records=count_new_records).model_dump(),
            "references": {
                "project": {
                    "uid": project.get_uid(),
                },
                "column": {
                    "uid": column.get_uid(),
                },
            },
        }
    )


@AppRouter.api.get(
    "/activity/project/{project_uid}/card/{card_uid}",
    tags=["Activity"],
    responses=(
        OpenApiSchema()
        .suc(_create_project_activity_schema(references={"card": {"uid": "string"}}))
        .auth()
        .forbidden()
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_card_activities(
    project_uid: str,
    card_uid: str,
    pagination: ActivityPagination = Depends(),
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    assignee = service.activity.get_user_or_bot(pagination.assignee_uid) if pagination.assignee_uid else None
    if not await _can_view_other_assignee_activities(project_uid, user, assignee, service):
        return JsonResponse(content=InfiniteRefreshableList())

    if pagination.only_count:
        result = await service.activity.get_list_by_card(
            project_uid, card_uid, pagination, pagination.refer_time, only_count=True, assignee=assignee
        )
        return JsonResponse(content=InfiniteRefreshableList(count_new_records=result or 0))

    result = await service.activity.get_list_by_card(
        project_uid, card_uid, pagination, pagination.refer_time, assignee=assignee
    )
    if not result:
        return JsonResponse(content=InfiniteRefreshableList())
    activities, count_new_records, project, card = result
    return JsonResponse(
        content={
            **InfiniteRefreshableList(records=activities, count_new_records=count_new_records).model_dump(),
            "references": {
                "project": {
                    "uid": project.get_uid(),
                },
                "card": {
                    "uid": card.get_uid(),
                },
            },
        }
    )


@AppRouter.api.get(
    "/activity/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Activity"],
    responses=(
        OpenApiSchema()
        .suc(_create_project_activity_schema(ProjectWikiActivity, {"project_wiki": {"uid": "string"}}))
        .auth()
        .forbidden()
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_wiki_activities(
    project_uid: str,
    wiki_uid: str,
    pagination: ActivityPagination = Depends(),
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    assignee = service.activity.get_user_or_bot(pagination.assignee_uid) if pagination.assignee_uid else None
    if not await _can_view_other_assignee_activities(project_uid, user, assignee, service):
        return JsonResponse(content=InfiniteRefreshableList())

    if pagination.only_count:
        result = await service.activity.get_list_by_wiki(
            project_uid, wiki_uid, pagination, pagination.refer_time, only_count=True, assignee=assignee
        )
        return JsonResponse(content=InfiniteRefreshableList(count_new_records=result or 0))

    result = await service.activity.get_list_by_wiki(
        project_uid, wiki_uid, pagination, pagination.refer_time, assignee=assignee
    )
    if not result:
        return JsonResponse(content=InfiniteRefreshableList())
    activities, count_new_records, project, project_wiki = result
    return JsonResponse(
        content={
            **InfiniteRefreshableList(records=activities, count_new_records=count_new_records).model_dump(),
            "references": {
                "project": {
                    "uid": project.get_uid(),
                },
                "project_wiki": {
                    "uid": project_wiki.get_uid(),
                },
            },
        }
    )


async def _can_view_other_assignee_activities(
    project_uid: str, user: User, assignee: User | Bot | None, service: Service
) -> bool:
    return (
        not assignee
        or user.is_admin
        or isinstance(assignee, Bot)
        or (await service.project.is_user_related_to_other_user(user, assignee, project_uid))
    )
