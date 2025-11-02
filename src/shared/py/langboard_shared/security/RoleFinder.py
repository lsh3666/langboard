from typing import Any
from sqlmodel.sql.expression import SelectOfScalar
from ..core.types import SnowflakeID
from ..models import Project, ProjectRole


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
