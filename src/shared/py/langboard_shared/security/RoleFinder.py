from typing import Any
from sqlmodel.sql.expression import SelectOfScalar
from ..core.types import SnowflakeID
from ..domain.models import ApiKeyRole, McpRole, Project, ProjectRole, SettingRole


def project(
    query: SelectOfScalar[ProjectRole], path_params: dict[str, Any], user_id: int
) -> SelectOfScalar[ProjectRole]:
    project_uid: str | set | list | None = path_params.get("project_uid", None)

    query = query.join(
        Project,
        (Project.column("id") == ProjectRole.column("project_id")) & (Project.column("deleted_at") == None),  # noqa
    )

    if isinstance(project_uid, (set, list)):
        query = query.where(Project.column("id").in_(SnowflakeID.from_short_code(uid) for uid in project_uid))
    else:
        query = query.where(Project.column("id") == SnowflakeID.from_short_code(project_uid) if project_uid else None)  # type: ignore

    return query


def setting(
    query: SelectOfScalar[SettingRole], path_params: dict[str, Any], user_id: int
) -> SelectOfScalar[SettingRole]:
    """RoleFinder for SettingRole - no additional filtering needed."""
    return query


def api_key(query: SelectOfScalar[ApiKeyRole], path_params: dict[str, Any], user_id: int) -> SelectOfScalar[ApiKeyRole]:
    """RoleFinder for ApiKeyRole - no additional filtering needed."""
    return query


def mcp(query: SelectOfScalar[McpRole], path_params: dict[str, Any], user_id: int) -> SelectOfScalar[McpRole]:
    """RoleFinder for McpRole - no additional filtering needed."""
    return query
