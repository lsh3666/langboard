from typing import Any, Literal, overload
from core.db import DbSession, EditorContentModel, SqlBuilder
from core.service import BaseService
from core.storage import FileModel
from core.types import SnowflakeID
from core.utils.Converter import convert_python_data
from helpers import ServiceHelper
from models import (
    Bot,
    Project,
    ProjectAssignedUser,
    ProjectWiki,
    ProjectWikiAssignedUser,
    ProjectWikiAttachment,
    User,
)
from publishers import ProjectWikiPublisher
from ...tasks.activities import ProjectWikiActivityTask
from ...tasks.bots import ProjectWikiBotTask
from .NotificationService import NotificationService
from .ProjectService import ProjectService
from .Types import TProjectParam, TUserOrBot, TWikiParam


class ProjectWikiService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_wiki"

    async def get_by_uid(self, uid: str) -> ProjectWiki | None:
        return ServiceHelper.get_by_param(ProjectWiki, uid)

    async def get_all_by_project(self, project: TProjectParam) -> list[ProjectWiki]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []
        return ServiceHelper.get_all_by(ProjectWiki, "project_id", project.id)

    async def get_board_list(self, user_or_bot: TUserOrBot, project: TProjectParam) -> list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []
        raw_wikis = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectWiki)
                .where(ProjectWiki.column("project_id") == project.id)
                .order_by(ProjectWiki.column("order").asc())
                .group_by(ProjectWiki.column("id"), ProjectWiki.column("order"))
            )
            raw_wikis = result.all()

        wikis = [await self.convert_to_api_response(user_or_bot, project, raw_wiki) for raw_wiki in raw_wikis]

        return wikis

    async def convert_to_api_response(
        self, user_or_bot: TUserOrBot, project: Project, wiki: ProjectWiki
    ) -> dict[str, Any]:
        api_wiki = wiki.api_response()
        api_wiki["assigned_members"] = []
        if wiki.is_public:
            return api_wiki

        assigned_users = await self.get_assigned_users(wiki, as_api=False)
        assigned_user_ids = [assigned_user.id for assigned_user, _ in assigned_users]

        is_showable = (
            wiki.is_public
            or (
                isinstance(user_or_bot, User)
                and (user_or_bot.is_admin or project.owner_id == user_or_bot.id or user_or_bot.id in assigned_user_ids)
            )
            or isinstance(user_or_bot, Bot)
        )

        if is_showable:
            api_wiki["assigned_members"] = [assigned_user.api_response() for assigned_user, _ in assigned_users]
        else:
            api_wiki = wiki.convert_to_private_api_response()

        return api_wiki

    @overload
    async def get_assigned_users(
        self, wiki: TWikiParam, as_api: Literal[False]
    ) -> list[tuple[User, ProjectWikiAssignedUser]]: ...
    @overload
    async def get_assigned_users(self, wiki: TWikiParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_users(
        self, wiki: TWikiParam, as_api: bool
    ) -> list[tuple[User, ProjectWikiAssignedUser]] | list[dict[str, Any]]:
        wiki = ServiceHelper.get_by_param(ProjectWiki, wiki)
        if not wiki:
            return []
        raw_users = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(User, ProjectWikiAssignedUser)
                .join(
                    ProjectWikiAssignedUser,
                    User.column("id") == ProjectWikiAssignedUser.column("user_id"),
                )
                .where(ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
            )
            raw_users = result.all()
        if not as_api:
            return raw_users

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def is_assigned(self, user: User, wiki: TWikiParam) -> bool:
        if user.is_admin:
            return True

        wiki = ServiceHelper.get_by_param(ProjectWiki, wiki)
        if not wiki:
            return False

        if wiki.is_public:
            return True

        record = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectWikiAssignedUser)
                .where(
                    (ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id)
                    & (ProjectWikiAssignedUser.column("user_id") == user.id)
                )
                .limit(1)
            )
            record = result.first()
        return bool(record)

    async def create(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        title: str,
        content: EditorContentModel | None = None,
    ) -> tuple[ProjectWiki, dict[str, Any]] | None:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return None

        max_order = ServiceHelper.get_max_order(ProjectWiki, "project_id", project.id)

        wiki = ProjectWiki(
            project_id=project.id,
            title=title,
            content=content or EditorContentModel(),
            order=max_order,
        )
        with DbSession.use(readonly=False) as db:
            db.insert(wiki)

        api_wiki = wiki.api_response()
        api_wiki["assigned_members"] = []
        await ProjectWikiPublisher.created(project, wiki)
        ProjectWikiActivityTask.project_wiki_created(user_or_bot, project, wiki)
        ProjectWikiBotTask.project_wiki_created(user_or_bot, project, wiki)

        return wiki, api_wiki

    async def update(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        wiki: TWikiParam,
        form: dict,
    ) -> dict[str, Any] | Literal[True] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
        if not params:
            return None
        project, wiki = params

        mutable_keys = ["title", "content"]

        old_wiki_record = {}
        for key in mutable_keys:
            if key not in form or not hasattr(wiki, key):
                continue
            old_value = getattr(wiki, key)
            new_value = form[key]
            if old_value == new_value or (key == "title" and not new_value):
                continue
            old_wiki_record[key] = convert_python_data(old_value)
            setattr(wiki, key, new_value)

        if not old_wiki_record:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(wiki)

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_wiki_record:
                continue
            model[key] = convert_python_data(getattr(wiki, key))

        await ProjectWikiPublisher.updated(project, wiki, model)

        notification_service = self._get_service(NotificationService)
        if "content" in model:
            await notification_service.notify_mentioned_in_wiki(user_or_bot, project, wiki)

        ProjectWikiActivityTask.project_wiki_updated(user_or_bot, project, old_wiki_record, wiki)
        ProjectWikiBotTask.project_wiki_updated(user_or_bot, project, wiki)

        return model

    async def change_public(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        wiki: TWikiParam,
        is_public: bool,
    ) -> tuple[ProjectWiki, Project] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
        if not params:
            return None
        project, wiki = params

        if is_public:
            with DbSession.use(readonly=False) as db:
                db.exec(
                    SqlBuilder.delete.table(ProjectWikiAssignedUser).where(
                        ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id
                    )
                )
        else:
            project_assigned = None
            with DbSession.use(readonly=True) as db:
                result = db.exec(
                    SqlBuilder.select.table(ProjectAssignedUser).where(
                        (ProjectAssignedUser.column("project_id") == project.id)
                        & (ProjectAssignedUser.column("user_id") == user_or_bot.id)
                    )
                )
                project_assigned = result.first()
            if not project_assigned:
                return None

            if isinstance(user_or_bot, User):
                model_params: dict[str, Any] = {
                    "project_assigned_id": project_assigned.id,
                    "project_wiki_id": wiki.id,
                }
                model_params["user_id"] = user_or_bot.id
                with DbSession.use(readonly=False) as db:
                    db.insert(ProjectWikiAssignedUser(**model_params))

        was_public = wiki.is_public
        wiki.is_public = is_public

        with DbSession.use(readonly=False) as db:
            db.update(wiki)

        await ProjectWikiPublisher.publicity_changed(user_or_bot, project, wiki)
        ProjectWikiActivityTask.project_wiki_publicity_changed(user_or_bot, project, was_public, wiki)
        ProjectWikiBotTask.project_wiki_publicity_changed(user_or_bot, project, wiki)

        return wiki, project

    async def update_assignees(
        self,
        user: User,
        project: TProjectParam,
        wiki: TWikiParam,
        assign_user_uids: list[str],
    ) -> tuple[ProjectWiki, Project] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
        if not params:
            return None
        project, wiki = params
        if wiki.is_public:
            return None

        original_assigned_users = await self.get_assigned_users(wiki, as_api=False)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(ProjectWikiAssignedUser).where(
                    ProjectWikiAssignedUser.column("project_wiki_id") == wiki.id
                )
            )

        target_users: list[User] = []
        if assign_user_uids:
            assignee_ids = [SnowflakeID.from_short_code(uid) for uid in assign_user_uids]
            project_service = self._get_service(ProjectService)
            raw_users = await project_service.get_assigned_users(
                project.id, as_api=False, where_user_ids_in=assignee_ids
            )

            for target_user, project_assigned_user in raw_users:
                with DbSession.use(readonly=False) as db:
                    db.insert(
                        ProjectWikiAssignedUser(
                            project_assigned_id=project_assigned_user.id,
                            project_wiki_id=wiki.id,
                            user_id=target_user.id,
                        )
                    )
                target_users.append(target_user)

        await ProjectWikiPublisher.assignees_updated(project, wiki, target_users)
        ProjectWikiActivityTask.project_wiki_assignees_updated(
            user,
            project,
            wiki,
            [target_user.id for target_user, _ in original_assigned_users],
            [target_user.id for target_user in target_users],
        )

        return wiki, project

    async def change_order(
        self, project: TProjectParam, wiki: TWikiParam, order: int
    ) -> tuple[Project, ProjectWiki] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
        if not params:
            return None
        project, wiki = params

        original_order = wiki.order
        update_query = SqlBuilder.update.table(ProjectWiki).where((ProjectWiki.column("project_id") == project.id))
        update_query = ServiceHelper.set_order_in_column(update_query, ProjectWiki, original_order, order)
        with DbSession.use(readonly=False) as db:
            # Lock
            db.exec(
                SqlBuilder.select.table(ProjectWiki)
                .where(ProjectWiki.column("project_id") == project.id)
                .with_for_update()
            ).all()

            db.exec(update_query)
            wiki.order = order
            db.update(wiki)

        await ProjectWikiPublisher.order_changed(project, wiki)

        return project, wiki

    async def upload_attachment(
        self,
        user: User,
        project: TProjectParam,
        wiki: TWikiParam,
        attachment: FileModel,
    ) -> ProjectWikiAttachment | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
        if not params:
            return None
        project, wiki = params

        max_order = ServiceHelper.get_max_order(ProjectWikiAttachment, "wiki_id", wiki.id)

        wiki_attachment = ProjectWikiAttachment(
            user_id=user.id,
            wiki_id=wiki.id,
            filename=attachment.original_filename,
            file=attachment,
            order=max_order,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(wiki_attachment)

        return wiki_attachment

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, wiki: TWikiParam) -> bool:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
        if not params:
            return False
        project, wiki = params

        with DbSession.use(readonly=False) as db:
            db.delete(wiki)

        await ProjectWikiPublisher.deleted(project, wiki)
        ProjectWikiActivityTask.project_wiki_deleted(user_or_bot, project, wiki)
        ProjectWikiBotTask.project_wiki_deleted(user_or_bot, project, wiki)

        return True
