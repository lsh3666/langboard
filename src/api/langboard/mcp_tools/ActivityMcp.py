from langboard_shared.core.schema import TimeBasedPagination
from langboard_shared.domain.models import Bot, User
from langboard_shared.domain.services.DomainService import DomainService
from ..mcp_integration import McpTool


class ActivityPagination(TimeBasedPagination):
    assignee_uid: str | None = None
    only_count: bool = False


@McpTool.add("user")
def get_current_user_activities(user_or_bot: User | Bot, service: DomainService, limit: int = 50) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    pagination = ActivityPagination(limit=limit)
    result = service.activity.get_api_list_by_user(user_or_bot, pagination)
    if not result:
        return {"activities": [], "count_new_records": 0}
    activities, count_new_records, _ = result
    return {"activities": activities, "count_new_records": count_new_records}


@McpTool.add("user")
def get_project_activities(project_uid: str, user_or_bot: User | Bot, service: DomainService, limit: int = 50) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    pagination = ActivityPagination(limit=limit)
    result = service.activity.get_api_list_by_project(project_uid, pagination)
    if not result:
        return {"activities": [], "count_new_records": 0}
    activities, count_new_records, project = result
    return {"activities": activities, "count_new_records": count_new_records, "project": {"uid": project.get_uid()}}


@McpTool.add("user")
def get_project_column_activities(
    project_uid: str, column_uid: str, user_or_bot: User | Bot, service: DomainService, limit: int = 50
) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    pagination = ActivityPagination(limit=limit)
    result = service.activity.get_api_list_by_column(project_uid, column_uid, pagination)
    if not result:
        return {"activities": [], "count_new_records": 0}
    activities, count_new_records, project, column = result
    return {
        "activities": activities,
        "count_new_records": count_new_records,
        "project": {"uid": project.get_uid()},
        "column": {"uid": column.get_uid()},
    }


@McpTool.add("user")
def get_card_activities(
    project_uid: str, card_uid: str, user_or_bot: User | Bot, service: DomainService, limit: int = 50
) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    pagination = ActivityPagination(limit=limit)
    result = service.activity.get_api_list_by_card(project_uid, card_uid, pagination)
    if not result:
        return {"activities": [], "count_new_records": 0}
    activities, count_new_records, project, card = result
    return {
        "activities": activities,
        "count_new_records": count_new_records,
        "project": {"uid": project.get_uid()},
        "card": {"uid": card.get_uid()},
    }


@McpTool.add("user")
def get_wiki_activities(
    project_uid: str, wiki_uid: str, user_or_bot: User | Bot, service: DomainService, limit: int = 50
) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    pagination = ActivityPagination(limit=limit)
    result = service.activity.get_api_list_by_wiki(project_uid, wiki_uid, pagination)
    if not result:
        return {"activities": [], "count_new_records": 0}
    activities, count_new_records, project, wiki = result
    return {
        "activities": activities,
        "count_new_records": count_new_records,
        "project": {"uid": project.get_uid()},
        "wiki": {"uid": wiki.get_uid()},
    }
