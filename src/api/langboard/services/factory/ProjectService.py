from typing import Any, Literal, cast, overload
from core.db import DbSession, SqlBuilder
from core.service import BaseService
from core.types import SafeDateTime, SnowflakeID
from core.utils.Converter import convert_python_data
from helpers import ServiceHelper
from models import (
    BotSchedule,
    Card,
    Checkitem,
    Checklist,
    InternalBot,
    Project,
    ProjectAssignedInternalBot,
    ProjectAssignedUser,
    ProjectBotSchedule,
    ProjectBotScope,
    ProjectRole,
    User,
)
from models.bases import ALL_GRANTED
from models.Checkitem import CheckitemStatus
from models.InternalBot import InternalBotType
from models.ProjectRole import ProjectRoleAction
from publishers import ProjectPublisher
from sqlalchemy.orm import aliased
from sqlalchemy.orm.attributes import InstrumentedAttribute
from ...ai import BotScheduleHelper
from ...tasks.activities import ProjectActivityTask
from ...tasks.bots import ProjectBotTask
from .BotScopeService import BotScopeService
from .InternalBotService import InternalBotService
from .ProjectColumnService import ProjectColumnService
from .ProjectInvitationService import ProjectInvitationService
from .ProjectLabelService import ProjectLabelService
from .RoleService import RoleService
from .Types import TInternalBotParam, TProjectParam, TUserOrBot, TUserParam


class ProjectService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project"

    async def get_by_uid(self, uid: str) -> Project | None:
        return ServiceHelper.get_by_param(Project, uid)

    async def get_one_actions(self, user: User, project: Project) -> list[str]:
        if user.is_admin:
            return [ALL_GRANTED]
        role_service = self._get_service(RoleService)
        role = await role_service.project.get_one(user_id=user.id, project_id=project.id)
        return role.actions if role else []

    async def get_all_role_actions(self, user: User) -> list[ProjectRole]:
        role_service = self._get_service(RoleService)
        roles = await role_service.project.get_list(user_id=user.id)
        return roles

    @overload
    async def get_assigned_users(
        self,
        project: TProjectParam,
        as_api: Literal[False],
        where_user_ids_in: list[SnowflakeID] | None = None,
    ) -> list[tuple[User, ProjectAssignedUser]]: ...
    @overload
    async def get_assigned_users(
        self,
        project: TProjectParam,
        as_api: Literal[True],
        where_user_ids_in: list[SnowflakeID] | None = None,
    ) -> list[dict[str, Any]]: ...
    async def get_assigned_users(
        self,
        project: TProjectParam,
        as_api: bool,
        where_user_ids_in: list[SnowflakeID] | None = None,
    ) -> list[tuple[User, ProjectAssignedUser]] | list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []
        query = (
            SqlBuilder.select.tables(User, ProjectAssignedUser)
            .join(
                ProjectAssignedUser,
                User.column("id") == ProjectAssignedUser.column("user_id"),
            )
            .where(ProjectAssignedUser.column("project_id") == project.id)
        )

        if where_user_ids_in is not None:
            query = query.where(User.column("id").in_(where_user_ids_in))

        raw_users = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            raw_users = result.all()
        if not as_api:
            return raw_users

        users = [user.api_response() for user, _ in raw_users]
        return users

    @overload
    async def get_assigned_internal_bots(
        self, project: TProjectParam, as_api: Literal[False]
    ) -> list[tuple[InternalBot, ProjectAssignedInternalBot]]: ...
    @overload
    async def get_assigned_internal_bots(
        self, project: TProjectParam, as_api: Literal[True]
    ) -> list[dict[str, Any]]: ...
    async def get_assigned_internal_bots(
        self, project: TProjectParam, as_api: bool
    ) -> list[tuple[InternalBot, ProjectAssignedInternalBot]] | list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []

        query = (
            SqlBuilder.select.tables(InternalBot, ProjectAssignedInternalBot)
            .join(
                ProjectAssignedInternalBot,
                InternalBot.column("id") == ProjectAssignedInternalBot.internal_bot_id,
            )
            .where(ProjectAssignedInternalBot.project_id == project.id)
        )

        raw_internal_bots = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            raw_internal_bots = result.all()
        if not as_api:
            return raw_internal_bots

        internal_bots = [internal_bot.api_response() for internal_bot, _ in raw_internal_bots]
        return internal_bots

    @overload
    async def get_bot_scopes(self, project: TProjectParam, as_api: Literal[False]) -> list[ProjectBotScope]: ...
    @overload
    async def get_bot_scopes(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_bot_scopes(
        self, project: TProjectParam, as_api: bool
    ) -> list[ProjectBotScope] | list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []

        bot_scope_service = self._get_service(BotScopeService)
        scopes = await bot_scope_service.get_list(ProjectBotScope, project_id=project.id)
        if not as_api:
            return scopes

        return [scope.api_response() for scope in scopes]

    @overload
    async def get_bot_schedules(
        self, project: TProjectParam, as_api: Literal[False]
    ) -> list[tuple[ProjectBotSchedule, BotSchedule]]: ...
    @overload
    async def get_bot_schedules(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_bot_schedules(
        self, project: TProjectParam, as_api: bool
    ) -> list[tuple[ProjectBotSchedule, BotSchedule]] | list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []

        schedules = await BotScheduleHelper.get_all_by_scope(
            ProjectBotSchedule,
            None,
            project,
            as_api=as_api,
        )

        return schedules

    async def get_dashboard_list(self, user: User) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        sql_query = (
            SqlBuilder.select.tables(Project, ProjectAssignedUser)
            .join(
                ProjectAssignedUser,
                Project.column("id") == ProjectAssignedUser.column("project_id"),
            )
            .where(ProjectAssignedUser.column("user_id") == user.id)
            .order_by(Project.column("updated_at").desc(), Project.column("id").desc())
        )

        raw_projects = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            raw_projects = result.all()

        column_service = self._get_service(ProjectColumnService)

        projects = []
        all_roles = await self.get_all_role_actions(user)
        roles_dict = {}

        if not user.is_admin:
            for role in all_roles:
                if role.project_id in roles_dict:
                    continue
                roles_dict[role.project_id] = role.actions

        project_ids = []
        for project, assigned_user in raw_projects:
            if not user.is_admin and project.id not in roles_dict:
                continue

            project_ids.append(project.id)

            project_dict = project.api_response()
            project_dict["starred"] = assigned_user.starred
            project_dict["last_viewed_at"] = assigned_user.last_viewed_at
            project_dict["current_auth_role_actions"] = roles_dict[project.id] if not user.is_admin else [ALL_GRANTED]
            projects.append(project_dict)

        columns = await column_service.get_all_by_project(project_ids, as_api=True)

        return projects, columns

    async def get_starred_projects(self, user: User) -> list[dict[str, str]]:
        if not user or user.is_new():
            return []

        raw_projects = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(Project)
                .join(
                    ProjectAssignedUser,
                    ProjectAssignedUser.column("project_id") == Project.column("id"),
                )
                .where(ProjectAssignedUser.column("user_id") == user.id)
                .where(ProjectAssignedUser.column("starred") == True)  # noqa
                .order_by(
                    ProjectAssignedUser.column("last_viewed_at").desc(),
                    Project.column("updated_at").desc(),
                    Project.column("id").desc(),
                )
                .group_by(
                    Project.column("id"),
                    ProjectAssignedUser.column("id"),
                    Project.column("updated_at"),
                    ProjectAssignedUser.column("last_viewed_at"),
                )
            )
            raw_projects = result.all()
        projects = []
        for project in raw_projects:
            api_project = project.api_response()
            api_project["current_auth_role_actions"] = await self.get_one_actions(user, project)
            projects.append(api_project)

        return projects

    async def get_details(
        self, user_or_bot: TUserOrBot, project: TProjectParam, is_setting: bool
    ) -> tuple[Project, dict[str, Any]] | None:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return None

        response = project.api_response()
        owner = ServiceHelper.get_by_param(User, project.owner_id, with_deleted=True)
        if not owner:
            return None

        invitation_service = self._get_service(ProjectInvitationService)
        invited_members = await invitation_service.get_invited_users(project, as_api=True)
        response["all_members"] = [
            owner.api_response(),
            *(await self.get_assigned_users(project, as_api=True)),
            *invited_members,
        ]
        response["invited_member_uids"] = [invitation["uid"] for invitation in invited_members]
        if isinstance(user_or_bot, User):
            response["current_auth_role_actions"] = await self.get_one_actions(user_or_bot, project)
        response["labels"] = await self._get_service(ProjectLabelService).get_all(project, as_api=True)
        if is_setting:
            role_service = self._get_service(RoleService)
            roles = await role_service.project.get_list(project_id=project.id)
            response["member_roles"] = {}
            for role in roles:
                if role.user_id and role.user_id != project.owner_id:
                    response["member_roles"][role.user_id.to_short_code()] = role.actions

        return project, response

    async def is_assigned(self, user: User, project: TProjectParam) -> tuple[bool, ProjectAssignedUser | None]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return False, None

        assignee = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectAssignedUser)
                .where(
                    (ProjectAssignedUser.column("project_id") == project.id)
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
                .limit(1)
            )
            assignee = result.first()
        return bool(assignee), assignee

    async def is_user_related_to_other_user(
        self, user: User, target_user: User, project: TProjectParam | None = None
    ) -> bool:
        user_a = aliased(ProjectAssignedUser)
        user_b = aliased(ProjectAssignedUser)

        query = (
            SqlBuilder.select.column(user_a.id)
            .join(
                user_b,
                cast(InstrumentedAttribute, user_a.project_id) == user_b.project_id,
            )
            .where((user_a.user_id == user.id) & (user_b.user_id == target_user.id))
            .limit(1)
        )

        if project:
            project = ServiceHelper.convert_id(project)
            query = query.where((user_a.project_id == project) & (user_b.project_id == project))

        record = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            record = result.first()
        return bool(record)

    async def toggle_star(self, user: User, uid: str) -> bool:
        starred, project_id = None, None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.columns(ProjectAssignedUser.starred, Project.id)
                .join(
                    ProjectAssignedUser,
                    Project.column("id") == ProjectAssignedUser.column("project_id"),
                )
                .where(
                    (Project.column("id") == SnowflakeID.from_short_code(uid))
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
                .limit(1)
            )
            starred, project_id = result.first() or (None, None)

        if project_id is None:
            return False

        with DbSession.use(readonly=False) as db:
            result = db.exec(
                SqlBuilder.update.table(ProjectAssignedUser)
                .values(starred=not starred)
                .where(
                    (ProjectAssignedUser.column("project_id") == project_id)
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
            )

        return result > 0

    async def set_last_view(self, user: User, project: Project) -> None:
        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(ProjectAssignedUser)
                .values(last_viewed_at=SafeDateTime.now())
                .where(
                    (ProjectAssignedUser.column("project_id") == project.id)
                    & (ProjectAssignedUser.column("user_id") == user.id)
                )
            )

    async def create(
        self,
        user: User,
        title: str,
        description: str | None = None,
        project_type: str = "Other",
    ) -> Project:
        project = Project(
            owner_id=user.id,
            title=title,
            description=description,
            project_type=project_type,
        )
        with DbSession.use(readonly=False) as db:
            db.insert(project)

        column_service = self._get_service(ProjectColumnService)
        await column_service.get_or_create_archive_if_not_exists(project.id)

        label_service = self._get_service(ProjectLabelService)
        await label_service.init_defaults(project)

        assigned_user = ProjectAssignedUser(project_id=project.id, user_id=user.id)
        with DbSession.use(readonly=False) as db:
            db.insert(assigned_user)

        role_service = self._get_service(RoleService)
        await role_service.project.grant_all(user_id=user.id, project_id=project.id)

        internal_bot_service = self._get_service(InternalBotService)
        internal_bots = await internal_bot_service.get_list_by_default()

        for internal_bot in internal_bots:
            assigned_internal_bot = ProjectAssignedInternalBot(project_id=project.id, internal_bot_id=internal_bot.id)
            with DbSession.use(readonly=False) as db:
                db.insert(assigned_internal_bot)

        ProjectActivityTask.project_created(user, project)

        return project

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return None

        old_project_record = {}
        mutable_keys = ["title", "description", "project_type", "ai_description"]

        for key in mutable_keys:
            if key not in form or not hasattr(project, key):
                continue
            old_value = getattr(project, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_project_record[key] = convert_python_data(old_value)
            setattr(project, key, new_value)

        if not old_project_record:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(project)

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_project_record:
                continue
            model[key] = convert_python_data(getattr(project, key))

        await ProjectPublisher.updated(project, model)
        ProjectActivityTask.project_updated(user_or_bot, old_project_record, project)
        ProjectBotTask.project_updated(user_or_bot, project)

        return model

    async def update_assigned_users(self, user: User, project: TProjectParam, emails: list[str]) -> bool:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return False

        old_assigned_users = await self.get_assigned_users(project, as_api=False)

        invitation_service = self._get_service(ProjectInvitationService)
        invitation_related_data = await invitation_service.get_invitation_related_data(project, emails)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(ProjectRole).where(
                    (ProjectRole.column("project_id") == project.id)
                    & (ProjectRole.column("user_id").in_(list(invitation_related_data.user_ids_should_delete)))
                    & (ProjectRole.column("user_id") != user.id)
                    & (ProjectRole.column("user_id") != None)  # noqa
                )
            )

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(ProjectAssignedUser).where(
                    (ProjectAssignedUser.column("project_id") == project.id)
                    & ProjectAssignedUser.column("id").in_(list(invitation_related_data.assigned_ids_should_delete))
                    & (ProjectAssignedUser.column("user_id") != user.id)
                )
            )

        result = await invitation_service.invite_emails(user, project, invitation_related_data)

        new_assigned_users = await self.get_assigned_users(project, as_api=False)
        model = {
            "assigned_members": [user.api_response() for user, _ in new_assigned_users],
            "invited_members": await invitation_service.get_invited_users(project, as_api=True),
        }

        await ProjectPublisher.assigned_users_updated(project, model)
        ProjectActivityTask.project_assigned_users_updated(
            user,
            project,
            [user.id for user, _ in old_assigned_users],
            [user.id for user, _ in new_assigned_users],
        )

        return result

    async def unassign_assignee(self, user: User, project: TProjectParam, target: TUserParam) -> bool:
        project = ServiceHelper.get_by_param(Project, project)
        target_user = ServiceHelper.get_by_param(User, target)
        if not target_user:
            return False

        if not project or not (await self.is_assigned(target_user, project))[0] or project.owner_id == target_user.id:
            return False

        users = await self.get_assigned_users(project, as_api=False)
        invitation_service = self._get_service(ProjectInvitationService)
        invitations = await invitation_service.get_invited_users(project, as_api=False)
        new_user_emails = [
            *[user.email for user, _ in users if user.id != target_user.id],
            *[invitation.email for invitation, user in invitations if not user or user.id != target_user.id],
        ]

        return await self.update_assigned_users(user, project, new_user_emails)

    async def update_user_roles(
        self,
        project: TProjectParam,
        target_user: TUserParam,
        roles: list[ProjectRoleAction],
    ):
        project = ServiceHelper.get_by_param(Project, project)
        target_user = ServiceHelper.get_by_param(User, target_user)
        if not project or not target_user or not (await self.is_assigned(target_user, project))[0]:
            return False

        if project.owner_id == target_user.id:
            return True

        if ProjectRoleAction.Read not in roles:
            roles.append(ProjectRoleAction.Read)

        role_strs = [role.value for role in roles]
        role_service = self._get_service(RoleService)
        if roles == list(ProjectRoleAction._member_map_.values()):
            await role_service.project.grant_all(user_id=target_user.id, project_id=project.id)
        elif not roles:
            await role_service.project.grant_default(user_id=target_user.id, project_id=project.id)
        else:
            await role_service.project.grant(actions=role_strs, user_id=target_user.id, project_id=project.id)

        await ProjectPublisher.user_roles_updated(project, target_user, role_strs)

        return True

    async def change_internal_bot(self, project: TProjectParam, internal_bot: TInternalBotParam):
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return False

        internal_bot = ServiceHelper.get_by_param(InternalBot, internal_bot)
        if not internal_bot:
            return False

        original_internal_bot = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(InternalBot)
                .join(
                    ProjectAssignedInternalBot,
                    InternalBot.column("id") == ProjectAssignedInternalBot.column("internal_bot_id"),
                )
                .where(
                    (ProjectAssignedInternalBot.column("project_id") == project.id)
                    & (InternalBot.column("bot_type") == internal_bot.bot_type)
                )
                .limit(1)
            )
            original_internal_bot = result.first()

        if not original_internal_bot:
            return False

        if original_internal_bot.id == internal_bot.id:
            return True

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(ProjectAssignedInternalBot)
                .values({ProjectAssignedInternalBot.column("internal_bot_id"): internal_bot.id})
                .where(
                    (ProjectAssignedInternalBot.column("project_id") == project.id)
                    & (ProjectAssignedInternalBot.column("internal_bot_id") == original_internal_bot.id)
                )
            )

        await ProjectPublisher.internal_bot_changed(project, internal_bot.id)

        return True

    async def change_internal_bot_settings(
        self,
        project: TProjectParam,
        bot_type: InternalBotType,
        use_default_prompt: bool | None = None,
        prompt: str | None = None,
    ):
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return False

        assigned_internal_bot = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectAssignedInternalBot)
                .join(
                    InternalBot,
                    ProjectAssignedInternalBot.column("internal_bot_id") == InternalBot.column("id"),
                )
                .where(
                    (ProjectAssignedInternalBot.column("project_id") == project.id)
                    & (InternalBot.column("bot_type") == bot_type)
                )
                .limit(1)
            )
            assigned_internal_bot = result.first()

        if not assigned_internal_bot:
            return False

        should_update = False
        if use_default_prompt is not None and assigned_internal_bot.use_default_prompt != use_default_prompt:
            assigned_internal_bot.use_default_prompt = use_default_prompt
            should_update = True

        if prompt is not None and assigned_internal_bot.prompt != prompt:
            assigned_internal_bot.prompt = prompt
            should_update = True

        if not should_update:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(assigned_internal_bot)

        await ProjectPublisher.internal_bot_settings_changed(project, bot_type, assigned_internal_bot)

        return True

    async def delete(self, user: User, project: TProjectParam) -> bool:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return False

        started_checkitems = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(Checkitem, Card)
                .join(
                    Checklist,
                    Checkitem.column("checklist_id") == Checklist.column("id"),
                )
                .join(Card, Checklist.column("card_id") == Card.column("id"))
                .where(
                    (Card.column("project_id") == project.id) & (Checkitem.column("status") == CheckitemStatus.Started)
                )
            )
            started_checkitems = result.all()

        checkitem_service = self._get_service_by_name("checkitem")
        current_time = SafeDateTime.now()
        for checkitem, card in started_checkitems:
            await checkitem_service.change_status(
                user,
                project,
                card,
                checkitem,
                CheckitemStatus.Stopped,
                current_time,
                should_publish=False,
            )

        with DbSession.use(readonly=False) as db:
            db.delete(project)

        await ProjectPublisher.deleted(project)
        ProjectActivityTask.project_deleted(user, project)
        ProjectBotTask.project_deleted(user, project)

        return True
