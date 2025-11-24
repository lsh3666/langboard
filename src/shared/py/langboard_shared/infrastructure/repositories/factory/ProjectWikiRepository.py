from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseOrderRepository
from ....core.types.ParamTypes import TProjectParam
from ....domain.models import Project, ProjectWiki
from ....helpers import InfraHelper


class ProjectWikiRepository(BaseOrderRepository[ProjectWiki, Project]):
    @staticmethod
    def parent_model_cls():
        return Project

    @staticmethod
    def model_cls():
        return ProjectWiki

    @staticmethod
    def name() -> str:
        return "project_wiki"

    def get_all_by_project(self, project: TProjectParam):
        project_id = InfraHelper.convert_id(project)
        wikis = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectWiki)
                .where(ProjectWiki.column("project_id") == project_id)
                .order_by(ProjectWiki.column("order").asc())
                .group_by(ProjectWiki.column("id"), ProjectWiki.column("order"))
            )
            wikis = result.all()
        return wikis
