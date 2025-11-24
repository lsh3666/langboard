from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TInternalBotParam, TProjectParam
from ....domain.models import InternalBot, Project, ProjectAssignedInternalBot
from ....domain.models.InternalBot import InternalBotType
from ....helpers import InfraHelper


class ProjectAssignedInternalBotRepository(BaseRepository[ProjectAssignedInternalBot]):
    @staticmethod
    def model_cls():
        return ProjectAssignedInternalBot

    @staticmethod
    def name() -> str:
        return "project_assigned_internal_bot"

    def get_all_by_project(self, project: TProjectParam) -> list[tuple[InternalBot, ProjectAssignedInternalBot]]:
        project_id = InfraHelper.convert_id(project)
        query = (
            SqlBuilder.select.tables(InternalBot, ProjectAssignedInternalBot)
            .join(
                ProjectAssignedInternalBot,
                InternalBot.column("id") == ProjectAssignedInternalBot.internal_bot_id,
            )
            .where(ProjectAssignedInternalBot.project_id == project_id)
        )

        internal_bots = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            internal_bots = result.all()
        return internal_bots

    def get_all_projects_by_internal_bot(self, internal_bot: TInternalBotParam):
        internal_bot_id = InfraHelper.convert_id(internal_bot)
        projects = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(Project)
                .join(
                    ProjectAssignedInternalBot,
                    ProjectAssignedInternalBot.column("project_id") == Project.column("id"),
                )
                .where(ProjectAssignedInternalBot.column("internal_bot_id") == internal_bot_id)
            )
            projects = result.all()
        return projects

    def find_with_internal_bot_by_project_and_type(self, project: TProjectParam, bot_type: InternalBotType):
        project_id = InfraHelper.convert_id(project)

        assigned_internal_bot = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(InternalBot, ProjectAssignedInternalBot)
                .join(
                    InternalBot,
                    ProjectAssignedInternalBot.column("internal_bot_id") == InternalBot.column("id"),
                )
                .where(
                    (ProjectAssignedInternalBot.column("project_id") == project_id)
                    & (InternalBot.column("bot_type") == bot_type)
                )
                .limit(1)
            )
            assigned_internal_bot = result.first()
        return assigned_internal_bot

    def replace_by_project(
        self, project: TProjectParam, old_internal_bot: TInternalBotParam, new_internal_bot: TInternalBotParam
    ):
        project_id = InfraHelper.convert_id(project)
        original_internal_bot_id = InfraHelper.convert_id(old_internal_bot)
        new_internal_bot_id = InfraHelper.convert_id(new_internal_bot)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(ProjectAssignedInternalBot)
                .values({ProjectAssignedInternalBot.column("internal_bot_id"): new_internal_bot_id})
                .where(
                    (ProjectAssignedInternalBot.column("project_id") == project_id)
                    & (ProjectAssignedInternalBot.column("internal_bot_id") == original_internal_bot_id)
                )
            )

    def reassign_and_delete(self, old_internal_bot: TInternalBotParam, new_internal_bot: TInternalBotParam):
        old_internal_bot_id = InfraHelper.convert_id(old_internal_bot)
        new_internal_bot_id = InfraHelper.convert_id(new_internal_bot)
        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(ProjectAssignedInternalBot)
                .values({ProjectAssignedInternalBot.column("internal_bot_id"): new_internal_bot_id})
                .where(ProjectAssignedInternalBot.column("internal_bot_id") == old_internal_bot_id)
            )
            db.exec(SqlBuilder.delete.table(InternalBot).where(InternalBot.column("id") == old_internal_bot_id))
