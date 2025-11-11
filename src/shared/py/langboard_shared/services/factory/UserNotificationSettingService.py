from typing import Literal, Self, overload
from sqlmodel.sql.expression import SelectOfScalar
from ...core.db import BaseSqlModel, DbSession, SqlBuilder
from ...core.publisher import NotificationPublishModel
from ...core.service import BaseService
from ...helpers import ServiceHelper
from ...models import (
    Card,
    Project,
    ProjectColumn,
    ProjectWiki,
    User,
    UserNotificationUnsubscription,
)
from ...models.UserNotification import NotificationType
from ...models.UserNotificationUnsubscription import NotificationChannel, NotificationScope
from .Types import TCardParam, TColumnParam, TProjectParam, TWikiParam


class UserNotificationSettingService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user_notification_setting"

    def get_unsubscriptions_query_builder(self, user: User):
        class _QueryBuilder:
            def __init__(self, query: SelectOfScalar[UserNotificationUnsubscription]):
                self.__query = query

            def where_channel(self, channel: NotificationChannel):
                return _QueryBuilder(self.__query.where(UserNotificationUnsubscription.column("channel") == channel))

            def where_notification_type(self, notification_type: NotificationType | list[NotificationType]):
                if isinstance(notification_type, list):
                    return _QueryBuilder(
                        self.__query.where(
                            UserNotificationUnsubscription.column("notification_type").in_(notification_type)
                        )
                    )
                return _QueryBuilder(
                    self.__query.where(UserNotificationUnsubscription.column("notification_type") == notification_type)
                )

            @overload
            def where_scope(self, scope: Literal[NotificationScope.All]) -> Self: ...
            @overload
            def where_scope(self, scope: Literal[NotificationScope.Specific], model: BaseSqlModel) -> Self: ...
            @overload
            def where_scope(self, scope: Literal[NotificationScope.Specific], model: tuple[str, int]) -> Self: ...
            def where_scope(
                self,
                scope: NotificationScope,
                model: BaseSqlModel | tuple[str, int] | None = None,
            ):
                query = self.__query.where(UserNotificationUnsubscription.scope_type == scope)

                if scope == NotificationScope.Specific and model:
                    if isinstance(model, tuple):
                        tablename, record_id = model
                    else:
                        tablename = model.__tablename__
                        record_id = model.id

                    query = self.__query.where(
                        (UserNotificationUnsubscription.column("specific_table") == tablename)
                        & (UserNotificationUnsubscription.column("specific_id") == record_id)
                    )
                return _QueryBuilder(query)

            async def all(self):
                records = []
                with DbSession.use(readonly=True) as db:
                    result = db.exec(self.__query)
                    records = result.all()
                return records

            async def first(self):
                record = None
                with DbSession.use(readonly=True) as db:
                    result = db.exec(self.__query)
                    record = result.first()
                return record

        query = SqlBuilder.select.table(UserNotificationUnsubscription).where(
            UserNotificationUnsubscription.column("user_id") == user.id
        )
        return _QueryBuilder(query)

    @overload
    async def subscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: Literal[NotificationScope.All],
    ) -> list[NotificationType]: ...
    @overload
    async def subscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: Literal[NotificationScope.Specific],
        model: BaseSqlModel,
    ) -> list[NotificationType]: ...
    async def subscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: NotificationScope,
        model: BaseSqlModel | None = None,
    ):
        if not isinstance(notification_types, list):
            notification_types = [notification_types]

        for notification_type in [*notification_types]:
            if notification_type in UserNotificationUnsubscription.UNAVAILABLE_TYPES:
                notification_types.remove(notification_type)

        query = self.get_unsubscriptions_query_builder(user)
        query = query.where_channel(channel).where_notification_type(notification_types)
        if scope == NotificationScope.Specific:
            if not model:
                return False
            query = query.where_scope(scope, model)
        else:
            query = query.where_scope(scope)

        unsubscriptions = await query.all()

        for unsubscription in unsubscriptions:
            with DbSession.use(readonly=False) as db:
                db.delete(unsubscription)

        return notification_types

    @overload
    async def unsubscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: Literal[NotificationScope.All],
    ) -> list[NotificationType]: ...
    @overload
    async def unsubscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: Literal[NotificationScope.Specific],
        model: BaseSqlModel,
    ) -> list[NotificationType]: ...
    async def unsubscribe(
        self,
        user: User,
        channel: NotificationChannel,
        notification_types: NotificationType | list[NotificationType],
        scope: NotificationScope,
        model: BaseSqlModel | None = None,
    ):
        if not isinstance(notification_types, list):
            notification_types = [notification_types]

        for notification_type in [*notification_types]:
            if notification_type in UserNotificationUnsubscription.UNAVAILABLE_TYPES:
                notification_types.remove(notification_type)

        query = self.get_unsubscriptions_query_builder(user)
        query = query.where_channel(channel).where_notification_type(notification_types)
        if scope == NotificationScope.Specific:
            if not model:
                return False
            query = query.where_scope(scope, model)
        else:
            query = query.where_scope(scope)

        unsubscriptions = await query.all()
        already_unsubscribed_types = [unsubscription.notification_type for unsubscription in unsubscriptions]

        for notification_type in notification_types:
            if notification_type in already_unsubscribed_types:
                continue

            unsubscription = UserNotificationUnsubscription(
                user_id=user.id,
                channel=channel,
                notification_type=notification_type,
                scope_type=scope,
                specific_table=model.__tablename__ if model else None,
                specific_id=model.id if model else None,
            )

            with DbSession.use(readonly=False) as db:
                db.insert(unsubscription)

        return notification_types

    async def has_unsubscription(self, model: NotificationPublishModel, channel: NotificationChannel) -> bool:
        query = (
            self.get_unsubscriptions_query_builder(model.target_user)
            .where_channel(channel)
            .where_notification_type(model.notification.notification_type)
        )
        unsubscription = await query.where_scope(NotificationScope.All).first()
        if unsubscription:
            return True

        if not model.scope_models:
            return False

        table_ids_dict = ServiceHelper.combine_table_with_ids(model.scope_models)
        for table_name, record_id in model.scope_models:
            if (
                table_name not in table_ids_dict
                or not table_ids_dict[table_name]
                or record_id not in table_ids_dict[table_name]
            ):
                continue

            unsubscription = await query.where_scope(NotificationScope.Specific, (table_name, record_id)).first()
            if unsubscription:
                return True

        return False

    async def toggle_all(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [notification_type for notification_type in NotificationType],
            "scope": NotificationScope.All,
        }

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    async def toggle_type(
        self,
        user: User,
        channel: NotificationChannel,
        notification_type: NotificationType,
        is_unsubscribed: bool,
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": notification_type,
            "scope": NotificationScope.All,
        }

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    @overload
    async def toggle_project(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]: ...
    @overload
    async def toggle_project(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam,
    ) -> list[NotificationType]: ...
    async def toggle_project(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam | None = None,
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [
                NotificationType.AssignedToCard,
                NotificationType.MentionedInCard,
                NotificationType.MentionedInComment,
                NotificationType.MentionedInWiki,
                NotificationType.NotifiedFromChecklist,
                NotificationType.ReactedToComment,
            ],
        }

        if project:
            project = ServiceHelper.get_by_param(Project, project)
            if not project:
                return []
            params["scope"] = NotificationScope.Specific
            params["model"] = project
        else:
            params["scope"] = NotificationScope.All

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    @overload
    async def toggle_column(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]: ...
    @overload
    async def toggle_column(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam,
        column: TColumnParam,
    ) -> list[NotificationType]: ...
    async def toggle_column(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam | None = None,
        column: TColumnParam | None = None,
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [
                NotificationType.AssignedToCard,
                NotificationType.MentionedInCard,
                NotificationType.MentionedInComment,
                NotificationType.NotifiedFromChecklist,
                NotificationType.ReactedToComment,
            ],
        }

        if project and column:
            records = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
            if not records:
                return []
            project, column = records
            params["scope"] = NotificationScope.Specific
            params["model"] = column
        else:
            params["scope"] = NotificationScope.All

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    @overload
    async def toggle_card(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]: ...
    @overload
    async def toggle_card(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam,
        card: TCardParam,
    ) -> list[NotificationType]: ...
    async def toggle_card(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam | None = None,
        card: TCardParam | None = None,
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [
                NotificationType.AssignedToCard,
                NotificationType.MentionedInCard,
                NotificationType.MentionedInComment,
                NotificationType.NotifiedFromChecklist,
                NotificationType.ReactedToComment,
            ],
        }

        if project and card:
            records = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
            if not records:
                return []
            project, card = records
            params["scope"] = NotificationScope.Specific
            params["model"] = card
        else:
            params["scope"] = NotificationScope.All

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)

    @overload
    async def toggle_wiki(
        self, user: User, channel: NotificationChannel, is_unsubscribed: bool
    ) -> list[NotificationType]: ...
    @overload
    async def toggle_wiki(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam,
        wiki: TWikiParam,
    ) -> list[NotificationType]: ...
    async def toggle_wiki(
        self,
        user: User,
        channel: NotificationChannel,
        is_unsubscribed: bool,
        project: TProjectParam | None = None,
        wiki: TWikiParam | None = None,
    ) -> list[NotificationType]:
        params = {
            "user": user,
            "channel": channel,
            "notification_types": [NotificationType.MentionedInWiki],
        }

        if project and wiki:
            records = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
            if not records:
                return []
            project, wiki = records
            params["scope"] = NotificationScope.Specific
            params["model"] = wiki
        else:
            params["scope"] = NotificationScope.All

        if is_unsubscribed:
            return await self.unsubscribe(**params)
        return await self.subscribe(**params)
