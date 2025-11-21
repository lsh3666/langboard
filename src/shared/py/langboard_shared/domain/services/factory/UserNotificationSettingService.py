from typing import Literal, cast, overload
from ....core.db import BaseSqlModel
from ....core.domain import BaseDomainService
from ....core.publisher import NotificationPublishModel
from ....core.types.ParamTypes import TCardParam, TColumnParam, TProjectParam, TWikiParam
from ....domain.models import Card, Project, ProjectColumn, ProjectWiki, User, UserNotificationUnsubscription
from ....domain.models.UserNotification import NotificationType
from ....domain.models.UserNotificationUnsubscription import NotificationChannel, NotificationScope
from ....helpers import InfraHelper


class UserNotificationSettingService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user_notification_setting"

    async def get_api_map_by_user(self, user: User):
        notification_unsubs = await self.repo.user_notification_setting.get_unsubscriptions_query_builder(user).all()
        unsubs: dict[str, dict[str, dict[str, bool | list[str]]]] = {}
        for unsub in notification_unsubs:
            if unsub.scope_type.value not in unsubs:
                unsubs[unsub.scope_type.value] = {}
            unsubs_scope = unsubs[unsub.scope_type.value]
            if unsub.notification_type.value not in unsubs_scope:
                unsubs_scope[unsub.notification_type.value] = {}
            unsubs_type = unsubs_scope[unsub.notification_type.value]

            if unsub.scope_type == NotificationScope.All:
                unsubs_type[unsub.channel.value] = True
                continue

            if not unsub.specific_id:
                continue

            unsubs_type[unsub.channel.value] = []
            cast(list, unsubs_type[unsub.channel.value]).append(unsub.specific_id.to_short_code())
        return unsubs

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

        query = self.repo.user_notification_setting.get_unsubscriptions_query_builder(user)
        query = query.where_channel(channel).where_notification_type(notification_types)
        if scope == NotificationScope.Specific:
            if not model:
                return False
            query = query.where_scope(scope, model)
        else:
            query = query.where_scope(scope)

        unsubscriptions = await query.all()

        for unsubscription in unsubscriptions:
            self.repo.user_notification_setting.delete(unsubscription)

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

        query = self.repo.user_notification_setting.get_unsubscriptions_query_builder(user)
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

            self.repo.user_notification_setting.insert(unsubscription)

        return notification_types

    async def has_unsubscription(self, model: NotificationPublishModel, channel: NotificationChannel) -> bool:
        query = (
            self.repo.user_notification_setting.get_unsubscriptions_query_builder(model.target_user)
            .where_channel(channel)
            .where_notification_type(model.notification.notification_type)
        )
        unsubscription = await query.where_scope(NotificationScope.All).first()
        if unsubscription:
            return True

        if not model.scope_models:
            return False

        table_ids_dict = InfraHelper.combine_table_with_ids(model.scope_models)
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
            project = InfraHelper.get_by_id_like(Project, project)
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
            records = InfraHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
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
            records = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
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
            records = InfraHelper.get_records_with_foreign_by_params((Project, project), (ProjectWiki, wiki))
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
