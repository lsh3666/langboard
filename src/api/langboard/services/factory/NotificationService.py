from datetime import timedelta
from typing import Any, Literal, TypeVar, cast, overload
from urllib.parse import urlparse
from core.db import BaseSqlModel, DbSession, EditorContentModel, SqlBuilder
from core.Env import UI_QUERY_NAMES, Env
from core.publisher import NotificationPublisher, NotificationPublishModel
from core.resources.locales.EmailTemplateNames import TEmailTemplateName
from core.service import BaseService
from core.types import SafeDateTime, SnowflakeID
from core.utils.EditorContentParser import change_date_element, find_mentioned
from core.utils.String import concat
from dateutil.relativedelta import relativedelta
from helpers import ServiceHelper
from models import (
    Bot,
    Card,
    CardComment,
    Checklist,
    Project,
    ProjectColumn,
    ProjectInvitation,
    ProjectWiki,
    User,
    UserNotification,
)
from models.UserNotification import NotificationType
from ...tasks.bot import BotDefaultTask
from .Types import TNotificationParam, TUserOrBot, TUserParam


_TModel = TypeVar(
    "_TModel",
    bound=User | Bot | Project | ProjectInvitation | ProjectWiki | Card | CardComment | Checklist,
)


class NotificationService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "notification"

    async def get_list(self, user: User, time_range: Literal["3d", "7d", "1m", "all"] = "3d") -> list[dict[str, Any]]:
        query = SqlBuilder.select.table(UserNotification).where((UserNotification.column("receiver_id") == user.id))

        if time_range.endswith("d"):
            days = int(time_range[:-1])
            query = query.where(UserNotification.column("created_at") >= SafeDateTime.now() - timedelta(days=days))
        elif time_range.endswith("m"):
            month = int(time_range[:-1])
            query = query.where(
                UserNotification.column("created_at") >= SafeDateTime.now() - relativedelta(months=month)
            )

        query = query.order_by(
            UserNotification.column("created_at").desc(),
            UserNotification.column("id").desc(),
        )

        raw_notifications = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            raw_notifications = result.all()

        references: list[tuple[str, int]] = []
        for notification in raw_notifications:
            references.append((notification.notifier_type, notification.notifier_id))
            for table_name, record_id in notification.record_list:
                references.append((table_name, record_id))
        cached_dict = ServiceHelper.get_references(references, as_type="notification")

        notifications = []
        notification_ids_should_delete = []
        for notification in raw_notifications:
            notification_records = {}
            should_continue = True
            for table_name, record_id in notification.record_list:
                record = cached_dict.get(f"{table_name}_{record_id}")
                if not record:
                    should_continue = False
                    break
                notification_records[table_name] = record
            if not should_continue:
                notification_ids_should_delete.append(notification.id)
                continue

            notifier_cache_key = f"{notification.notifier_type}_{notification.notifier_id}"
            notifier_key = f"notifier_{notification.notifier_type}"
            notifier = cached_dict.get(notifier_cache_key)
            if not notifier:
                continue

            notifications.append(
                {
                    **notification.api_response(),
                    notifier_key: notifier,
                    "records": notification_records,
                }
            )

        if notification_ids_should_delete:
            with DbSession.use(readonly=False) as db:
                db.exec(
                    SqlBuilder.delete.table(UserNotification).where(
                        UserNotification.column("id").in_(notification_ids_should_delete)
                    )
                )

        return notifications

    async def convert_to_api_response(
        self,
        notification: UserNotification,
        record_list: list[_TModel] | None = None,
        notifier: TUserOrBot | None = None,
    ) -> dict[str, Any]:
        api_notification = notification.api_response()
        table_ids_dict = ServiceHelper.combine_table_with_ids(notification.record_list)

        records: dict[str, Any] = {}
        if record_list:
            for record in record_list:
                table_name = type(record).__tablename__
                if table_name not in records:
                    records[table_name] = {}
                records[table_name] = record.notification_data()
        else:
            for table_name, record_ids in table_ids_dict.items():
                results = ServiceHelper.get_records_by_table_name_with_ids(table_name, record_ids)
                if not results:
                    continue
                for record in results:
                    if table_name not in records:
                        records[table_name] = {}
                    records[table_name] = record.notification_data()

        api_notification["records"] = records
        if notifier:
            notifier_key, api_notifier = (
                "notifier_user" if isinstance(notifier, User) else "notifier_bot",
                notifier.api_response(),
            )
        else:
            notifier_key, api_notifier = await self.get_notifier(notification, as_api=True)
        api_notification[notifier_key] = api_notifier
        return api_notification

    @overload
    async def get_notifier(self, notification: UserNotification, as_api: Literal[False]) -> User | Bot: ...
    @overload
    async def get_notifier(
        self, notification: UserNotification, as_api: Literal[True]
    ) -> tuple[str, dict[str, Any]]: ...
    async def get_notifier(
        self, notification: UserNotification, as_api: bool
    ) -> User | Bot | tuple[str, dict[str, Any]]:
        if notification.notifier_type == "user":
            notifier = cast(
                User,
                ServiceHelper.get_by(User, "id", notification.notifier_id, with_deleted=True),
            )
        else:
            notifier = cast(
                Bot,
                ServiceHelper.get_by(Bot, "id", notification.notifier_id, with_deleted=True),
            )

        if not as_api:
            return notifier

        if notification.notifier_type == "user":
            return "notifier_user", notifier.api_response()
        return "notifier_bot", notifier.api_response()

    async def read(self, user: User, notification: TNotificationParam) -> bool:
        notification = ServiceHelper.get_by_param(UserNotification, notification)
        if not notification or notification.receiver_id != user.id:
            return False

        notification.read_at = SafeDateTime.now()
        with DbSession.use(readonly=False) as db:
            db.update(notification)

        return True

    async def read_all(self, user: User):
        sql_query = (
            SqlBuilder.update.table(UserNotification)
            .values({UserNotification.column("read_at"): SafeDateTime.now()})
            .where(
                (UserNotification.column("receiver_id") == user.id) & (UserNotification.column("read_at") == None)  # noqa
            )
        )
        with DbSession.use(readonly=False) as db:
            db.exec(sql_query)

    async def delete(self, user: User, notification: TNotificationParam) -> bool:
        notification = ServiceHelper.get_by_param(UserNotification, notification)
        if not notification or notification.receiver_id != user.id:
            return False

        with DbSession.use(readonly=False) as db:
            db.delete(notification)

        return True

    async def delete_all(self, user: User):
        sql_query = SqlBuilder.delete.table(UserNotification).where(UserNotification.column("receiver_id") == user.id)
        with DbSession.use(readonly=False) as db:
            db.exec(sql_query)

    # from here, notifiable types are added
    async def notify_project_invited(
        self,
        notifier: TUserOrBot,
        target_user: TUserParam,
        project: Project,
        project_invitation: ProjectInvitation,
    ):
        await self.__notify(
            notifier,
            target_user,
            NotificationType.ProjectInvited,
            None,
            [project, project_invitation],
        )

    async def notify_mentioned_in_card(self, notifier: TUserOrBot, project: Project, card: Card):
        column = await self.__get_column_by_card(card)
        await self.__notify_mentioned(
            notifier,
            card.description,
            NotificationType.MentionedInCard,
            [project, column, card],
            [project, card],
            "mentioned_in_card",
            {"url": self.__create_redirect_url(project, card)},
        )

    async def notify_mentioned_in_comment(
        self, notifier: TUserOrBot, project: Project, card: Card, comment: CardComment
    ):
        column = await self.__get_column_by_card(card)
        await self.__notify_mentioned(
            notifier,
            comment.content,
            NotificationType.MentionedInComment,
            [project, column, card],
            [project, card, comment],
            "mentioned_in_comment",
            {"url": self.__create_redirect_url(project, card)},
        )

    async def notify_mentioned_in_wiki(self, notifier: TUserOrBot, project: Project, wiki: ProjectWiki):
        await self.__notify_mentioned(
            notifier,
            wiki.content,
            NotificationType.MentionedInWiki,
            [project, wiki],
            [project, wiki],
            "mentioned_in_wiki",
            {"url": self.__create_redirect_url(project, wiki)},
        )

    async def notify_assigned_to_card(
        self,
        notifier: TUserOrBot,
        target_user: TUserParam,
        project: Project,
        card: Card,
    ):
        column = await self.__get_column_by_card(card)
        await self.__notify(
            notifier,
            target_user,
            NotificationType.AssignedToCard,
            [project, column, card],
            [project, card],
            {},
            "assigned_to_card",
            {"url": self.__create_redirect_url(project, card)},
        )

    async def notify_reacted_to_comment(
        self,
        notifier: TUserOrBot,
        project: Project,
        card: Card,
        comment: CardComment,
        reaction_type: str,
    ):
        column = await self.__get_column_by_card(card)
        first_line = ""
        if comment.content:
            content = change_date_element(comment.content).strip().splitlines()
            first_line = content.pop() if content else ""
        await self.__notify(
            notifier,
            cast(int, comment.user_id),
            NotificationType.ReactedToComment,
            [project, column, card],
            [project, card, comment],
            {"reaction_type": reaction_type, "line": first_line},
            "reacted_to_comment",
            {"url": self.__create_redirect_url(project, card)},
        )

    async def notify_checklist(
        self,
        notifier: TUserOrBot,
        target_user: TUserParam,
        project: Project,
        card: Card,
        checklist: Checklist,
    ):
        column = await self.__get_column_by_card(card)
        await self.__notify(
            notifier,
            target_user,
            NotificationType.NotifiedFromChecklist,
            [project, column, card],
            [project, card, checklist],
            None,
            "notified_from_checklist",
            {"url": self.__create_redirect_url(project, card)},
        )

    def create_record_list(self, record_list: list[_TModel]) -> list[tuple[str, SnowflakeID]]:
        return [(type(record).__tablename__, record.id) for record in record_list]

    # to here, notifiable types are added

    async def __notify_mentioned(
        self,
        notifier: TUserOrBot,
        editor: EditorContentModel | None,
        notification_type: NotificationType,
        scope_models: list[BaseSqlModel],
        references: list[_TModel],
        email_template_name: TEmailTemplateName,
        email_formats: dict[str, str],
    ):
        if not editor or not editor.content:
            return
        user_or_bot_uids, mentioned_lines = find_mentioned(editor)
        mentioned_in = ""
        other_models: list[BaseSqlModel] = []
        if email_template_name == "mentioned_in_card":
            mentioned_in = "card"
        elif email_template_name == "mentioned_in_comment":
            mentioned_in = "comment"
            other_models = [references[-1]]
        elif email_template_name == "mentioned_in_wiki":
            mentioned_in = "project_wiki"

        for user_or_bot_uid in user_or_bot_uids:
            result = await self.__notify(
                notifier,
                user_or_bot_uid,
                notification_type,
                scope_models,
                references,
                {"line": mentioned_lines[user_or_bot_uid]},
                email_template_name,
                email_formats,
            )

            if result or not mentioned_in:
                continue

            target_bot = ServiceHelper.get_by_param(Bot, user_or_bot_uid)
            if not target_bot or target_bot.id == notifier.id:
                continue

            models = [*scope_models, *other_models]
            dumped_models: list[tuple[str, dict]] = []
            for model in models:
                dumped_models.append((type(model).__tablename__, model.model_dump()))
            BotDefaultTask.bot_mentioned(notifier, target_bot, mentioned_in, dumped_models)

    async def __notify(
        self,
        notifier: TUserOrBot,
        target_user: TUserParam,
        notification_type: NotificationType,
        scope_models: list[BaseSqlModel] | None,
        references: list[_TModel],
        message_vars: dict[str, Any] | None = None,
        email_template_name: TEmailTemplateName | None = None,
        email_formats: dict[str, str] | None = None,
    ) -> bool:
        target_user = ServiceHelper.get_by_param(User, target_user)
        if not target_user or target_user.id == notifier.id:
            return False

        raw_record_list = self.create_record_list(references)
        record_list = [(table_name, SnowflakeID(record_id)) for table_name, record_id in raw_record_list]

        scope_model_tuples = (
            [(type(scope_model).__tablename__, int(scope_model.id)) for scope_model in scope_models]
            if scope_models
            else None
        )

        if email_formats:
            email_formats["recipient"] = target_user.firstname
            email_formats["sender"] = notifier.get_fullname()

        notification = UserNotification(
            id=SnowflakeID(),  # generate new ID
            notifier_type="user" if isinstance(notifier, User) else "bot",
            notifier_id=notifier.id,
            receiver_id=target_user.id,
            notification_type=notification_type,
            message_vars=message_vars or {},
            record_list=record_list,
        )

        model = NotificationPublishModel(
            notification=notification,
            api_notification=await self.convert_to_api_response(notification, references, notifier),
            target_user=target_user,
            scope_models=scope_model_tuples,
            email_template_name=email_template_name,
            email_formats=email_formats,
        )
        await NotificationPublisher.put_dispather(model)
        return True

    def __create_redirect_url(self, project: Project, card_or_wiki: ProjectWiki | Card | None = None):
        url_chunks = urlparse(Env.UI_REDIRECT_URL)
        query_string = ""
        if card_or_wiki:
            chunk_query = (
                UI_QUERY_NAMES.BOARD_CARD_CHUNK if isinstance(card_or_wiki, Card) else UI_QUERY_NAMES.BOARD_WIKI_CHUNK
            )
            main_query = UI_QUERY_NAMES.BOARD_CARD if isinstance(card_or_wiki, Card) else UI_QUERY_NAMES.BOARD_WIKI
            query_string = concat(
                chunk_query.value,
                "=",
                project.get_uid(),
                "&",
                main_query.value,
                "=",
                card_or_wiki.get_uid(),
            )
        else:
            query_string = concat(UI_QUERY_NAMES.BOARD.value, "=", project.get_uid())
        url = url_chunks._replace(
            query=concat(
                url_chunks.query,
                "&" if url_chunks.query else "",
                query_string,
            )
        ).geturl()

        return url

    async def __get_column_by_card(self, card: Card):
        column = ServiceHelper.get_by_param(ProjectColumn, card.project_column_id)
        return cast(ProjectColumn, column)
