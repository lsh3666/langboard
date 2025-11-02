from typing import Any, Literal, cast, overload
from sqlalchemy import func
from ...ai import BotScheduleHelper
from ...core.db import DbSession, EditorContentModel, SqlBuilder
from ...core.schema import Pagination
from ...core.service import BaseService
from ...core.types import SafeDateTime, SnowflakeID
from ...core.utils.Converter import convert_python_data
from ...helpers import ServiceHelper
from ...models import (
    BotSchedule,
    Card,
    CardAssignedProjectLabel,
    CardAssignedUser,
    CardBotSchedule,
    CardBotScope,
    CardComment,
    CardRelationship,
    Checkitem,
    Checklist,
    Project,
    ProjectColumn,
    ProjectLabel,
    ProjectRole,
    User,
)
from ...models.Checkitem import CheckitemStatus
from ...publishers import CardPublisher
from ...tasks.activities import CardActivityTask
from ...tasks.bots import CardBotTask
from .BotScopeService import BotScopeService
from .CardRelationshipService import CardRelationshipService
from .CheckitemService import CheckitemService
from .NotificationService import NotificationService
from .ProjectLabelService import ProjectLabelService
from .ProjectService import ProjectService
from .Types import TCardParam, TColumnParam, TProjectParam, TUserOrBot


class CardService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card"

    async def get_by_uid(self, uid: str) -> Card | None:
        return ServiceHelper.get_by_param(Card, uid)

    async def get_details(self, project: TProjectParam, card: TCardParam) -> dict[str, Any] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        column = ServiceHelper.get_by_param(ProjectColumn, card.project_column_id)
        if not column:
            return None

        api_card = card.api_response()
        api_card["project_column_name"] = column.name

        project_service = self._get_service(ProjectService)
        api_card["project_members"] = await project_service.get_assigned_users(card.project_id, as_api=True)

        project_label_service = self._get_service(ProjectLabelService)
        api_card["labels"] = await project_label_service.get_all_by_card(card, as_api=True)

        api_card["member_uids"] = await self.get_assigned_users(card, as_api=True, only_ids=True)

        card_relationship_service = self._get_service(CardRelationshipService)
        api_card["relationships"] = await card_relationship_service.get_all_by_card(card, as_api=True)
        return api_card

    async def get_board_list(self, project: TProjectParam) -> list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []

        raw_cards = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(
                    Card,
                    func.count(CardComment.column("id")).label("count_comment"),  # type: ignore
                )
                .join(Project, Card.column("project_id") == Project.column("id"))
                .outerjoin(
                    CardComment,
                    (Card.column("id") == CardComment.column("card_id")) & (CardComment.column("deleted_at") == None),  # noqa
                )
                .where(Project.column("id") == project.id)
                .order_by(Card.column("order").asc())
                .group_by(Card.column("id"), Card.column("order"))
            )
            raw_cards = result.all()
        cards = []

        project_label_service = self._get_service(ProjectLabelService)
        card_relationship_service = self._get_service(CardRelationshipService)

        raw_members = await self.get_assigned_users_by_project(project)
        members: dict[int, list[str]] = {}
        for user, card_assigned_user in raw_members:
            if card_assigned_user.card_id not in members:
                members[card_assigned_user.card_id] = []
            members[card_assigned_user.card_id].append(user.get_uid())

        raw_relationships = await card_relationship_service.get_all_by_project(project, as_api=False)
        relationships: dict[int, list[dict[str, Any]]] = {}
        for relationship, _ in raw_relationships:
            if relationship.card_id_parent not in relationships:
                relationships[relationship.card_id_parent] = []
            if relationship.card_id_child not in relationships:
                relationships[relationship.card_id_child] = []
            relationships[relationship.card_id_parent].append(relationship.api_response())
            relationships[relationship.card_id_child].append(relationship.api_response())

        raw_labels = await project_label_service.get_all_card_labels_by_project(project)
        labels: dict[int, list[dict[str, Any]]] = {}
        for label, card_label in raw_labels:
            if card_label.card_id not in labels:
                labels[card_label.card_id] = []
            labels[card_label.card_id].append(label.api_response())

        for card, count_comment in raw_cards:
            api_card = card.api_response()
            api_card["count_comment"] = count_comment
            api_card["member_uids"] = members.get(card.id, [])
            api_card["relationships"] = relationships.get(card.id, [])
            api_card["labels"] = labels.get(card.id, [])
            cards.append(api_card)

        return cards

    async def get_dashboard_list(
        self, user: User, pagination: Pagination, refer_time: SafeDateTime
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        query = (
            SqlBuilder.select.tables(Card, Project, ProjectColumn)
            .join(Project, Card.column("project_id") == Project.column("id"))
            .join(
                ProjectColumn,
                (Card.column("project_column_id") == ProjectColumn.column("id"))
                & (ProjectColumn.column("project_id") == Project.column("id")),
            )
            .join(ProjectRole, Project.column("id") == ProjectRole.column("project_id"))
            .outerjoin(
                CardAssignedUser,
                Card.column("id") == CardAssignedUser.column("card_id"),
            )
            .where(
                (ProjectRole.column("user_id") == user.id)
                & (
                    (
                        (ProjectRole.column("actions") == "*")
                        & (
                            (CardAssignedUser.column("card_id") == None)  # noqa
                            | (CardAssignedUser.column("user_id") == user.id)
                        )
                    )
                    | ((ProjectRole.column("actions") != "*") & (CardAssignedUser.column("user_id") == user.id))
                )
            )
            .where(Checkitem.column("created_at") <= refer_time)
            .order_by(Card.column("created_at").desc())
            .group_by(
                Card.column("id"),
                Card.column("created_at"),
                ProjectColumn.column("id"),
                Project.column("id"),
            )
        )
        query = ServiceHelper.paginate(query, pagination.page, pagination.limit)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            records = result.all()

        api_cards = []
        api_projects: dict[int, dict[str, Any]] = {}
        for card, project, column in records:
            api_card = card.api_response()
            api_card["project_column_name"] = column.name
            if project.id not in api_projects:
                api_projects[project.id] = project.api_response()
            api_cards.append(api_card)
        return api_cards, list(api_projects.values())

    @overload
    async def get_all_by_project(self, project: TProjectParam, as_api: Literal[False]) -> list[Card]: ...
    @overload
    async def get_all_by_project(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_project(self, project: TProjectParam, as_api: bool) -> list[Card] | list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(Card, ProjectColumn)
                .join(
                    ProjectColumn,
                    Card.column("project_column_id") == ProjectColumn.column("id"),
                )
                .where(Card.column("project_id") == project.id)
                .order_by(Card.column("order").asc())
            )
            records = result.all()
        if not as_api:
            return [card for card, _ in records]

        cards = []
        for card, column in records:
            api_card = card.api_response()
            api_card["project_column_name"] = column.name
            cards.append(api_card)
        return cards

    @overload
    async def get_assigned_users(
        self, card: TCardParam, as_api: Literal[False]
    ) -> list[tuple[User, CardAssignedUser]]: ...
    @overload
    async def get_assigned_users(self, card: TCardParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    @overload
    async def get_assigned_users(
        self, card: TCardParam, as_api: Literal[False], only_ids: Literal[True]
    ) -> list[tuple[SnowflakeID, CardAssignedUser]]: ...
    @overload
    async def get_assigned_users(
        self, card: TCardParam, as_api: Literal[True], only_ids: Literal[True]
    ) -> list[str]: ...
    async def get_assigned_users(
        self, card: TCardParam, as_api: bool, only_ids: bool = False
    ) -> (
        list[tuple[User, CardAssignedUser]]
        | list[dict[str, Any]]
        | list[tuple[SnowflakeID, CardAssignedUser]]
        | list[str]
    ):
        card = ServiceHelper.get_by_param(Card, card)
        if not card:
            return []

        raw_users = []
        if only_ids:
            query = SqlBuilder.select.columns(User.id, CardAssignedUser)
        else:
            query = SqlBuilder.select.tables(User, CardAssignedUser)
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                query.join(
                    CardAssignedUser,
                    User.column("id") == CardAssignedUser.column("user_id"),
                ).where(CardAssignedUser.column("card_id") == card.id)
            )
            raw_users = result.all()
        if not as_api:
            return cast(Any, raw_users)

        if only_ids:
            return cast(
                Any,
                [user_id.to_short_code() for user_id, _ in cast(list[tuple[SnowflakeID, CardAssignedUser]], raw_users)],
            )

        users = [user.api_response() for user, _ in cast(list[tuple[User, CardAssignedUser]], raw_users)]
        return users

    async def get_assigned_users_by_project(self, project: TProjectParam) -> list[tuple[User, CardAssignedUser]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []

        raw_users = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(User, CardAssignedUser)
                .join(
                    CardAssignedUser,
                    User.column("id") == CardAssignedUser.column("user_id"),
                )
                .join(Card, CardAssignedUser.column("card_id") == Card.column("id"))
                .join(Project, Card.column("project_id") == Project.column("id"))
                .where(Project.column("id") == project.id)
            )
            raw_users = result.all()
        return raw_users

    @overload
    async def get_bot_scopes(
        self, project: TProjectParam, card: TCardParam, as_api: Literal[False]
    ) -> list[CardBotScope]: ...
    @overload
    async def get_bot_scopes(
        self, project: TProjectParam, card: TCardParam, as_api: Literal[True]
    ) -> list[dict[str, Any]]: ...
    async def get_bot_scopes(
        self, project: TProjectParam, card: TCardParam, as_api: bool
    ) -> list[CardBotScope] | list[dict[str, Any]]:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return []
        project, card = params

        bot_scope_service = self._get_service(BotScopeService)
        scopes = await bot_scope_service.get_list(CardBotScope, card_id=card.id)
        if not as_api:
            return scopes

        return [scope.api_response() for scope in scopes]

    @overload
    async def get_bot_schedules(
        self, project: TProjectParam, card: TCardParam, as_api: Literal[False]
    ) -> list[tuple[CardBotSchedule, BotSchedule]]: ...
    @overload
    async def get_bot_schedules(
        self, project: TProjectParam, card: TCardParam, as_api: Literal[True]
    ) -> list[dict[str, Any]]: ...
    async def get_bot_schedules(
        self, project: TProjectParam, card: TCardParam, as_api: bool
    ) -> list[tuple[CardBotSchedule, BotSchedule]] | list[dict[str, Any]]:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return []
        project, card = params

        schedules = await BotScheduleHelper.get_all_by_scope(
            CardBotSchedule,
            None,
            card,
            as_api=as_api,
        )

        return schedules

    async def create(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        column: TColumnParam,
        title: str,
        description: EditorContentModel | None = None,
        assign_user_uids: list[str] | None = None,
    ) -> tuple[Card, dict[str, Any]] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
        if not params:
            return None
        project, column = params
        if column.is_archive:
            return None

        max_order = ServiceHelper.get_max_order(Card, "project_id", project.id, {"project_column_id": column.id})

        card = Card(
            project_id=project.id,
            project_column_id=column.id,
            title=title,
            description=description or EditorContentModel(),
            order=max_order,
        )
        with DbSession.use(readonly=False) as db:
            db.insert(card)

        users: list[User] = []
        if assign_user_uids:
            project_service = self._get_service(ProjectService)
            raw_users = await project_service.get_assigned_users(
                project.id,
                as_api=False,
                where_user_ids_in=[SnowflakeID.from_short_code(uid) for uid in assign_user_uids],
            )

            for assign_user, project_assigned_user in raw_users:
                with DbSession.use(readonly=False) as db:
                    users.append(assign_user)
                    db.insert(
                        CardAssignedUser(
                            project_assigned_id=project_assigned_user.id,
                            card_id=card.id,
                            user_id=assign_user.id,
                        )
                    )

        api_card = card.board_api_response(0, [user.get_uid() for user in users], [], [])
        model = {"card": api_card}

        await CardPublisher.created(project, column, model)
        CardActivityTask.card_created(user_or_bot, project, card)
        CardBotTask.card_created(user_or_bot, project, card)

        notification_service = self._get_service(NotificationService)
        for user in users:
            await notification_service.notify_assigned_to_card(user_or_bot, user, project, card)

        return card, api_card

    async def update(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        form: dict,
    ) -> dict[str, Any] | Literal[True] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        old_card_record = {}
        mutable_keys = ["title", "deadline_at", "description"]

        for key in mutable_keys:
            if key not in form or not hasattr(card, key):
                continue
            old_value = getattr(card, key)
            new_value = form[key]
            if old_value == new_value or (key == "title" and not new_value):
                continue
            old_card_record[key] = convert_python_data(old_value)
            setattr(card, key, new_value)

        if not old_card_record:
            return True

        checkitem_cardified_from = None
        if "title" in old_card_record:
            checkitem_cardified_from = ServiceHelper.get_by(Checkitem, "cardified_id", card.id)
            if checkitem_cardified_from:
                checkitem_cardified_from.title = card.title
                with DbSession.use(readonly=False) as db:
                    db.update(checkitem_cardified_from)

        with DbSession.use(readonly=False) as db:
            db.update(card)

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_card_record:
                continue
            model[key] = convert_python_data(getattr(card, key))

        await CardPublisher.updated(project, card, checkitem_cardified_from, model)

        if "description" in model and card.description:
            notification_service = self._get_service(NotificationService)
            await notification_service.notify_mentioned_in_card(user_or_bot, project, card)

        CardActivityTask.card_updated(user_or_bot, project, old_card_record, card)
        CardBotTask.card_updated(user_or_bot, project, card)

        return model

    async def change_order(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        order: int,
        new_column: TColumnParam | None,
    ) -> bool | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        original_column = None
        original_column = ServiceHelper.get_by_param(ProjectColumn, card.project_column_id)
        if not original_column or original_column.project_id != project.id:
            return None

        if new_column:
            new_column = ServiceHelper.get_by_param(ProjectColumn, new_column)
            if not new_column or new_column.project_id != card.project_id:
                return None

            card.project_column_id = new_column.id
            card.archived_at = SafeDateTime.now() if new_column.is_archive else None

        original_order = card.order

        with DbSession.use(readonly=False) as db:
            shared_update_query = SqlBuilder.update.table(Card).where(
                (Card.column("id") != card.id) & (Card.column("project_id") == card.project_id)
            )

            if new_column:
                # Lock
                db.exec(
                    SqlBuilder.select.table(Card)
                    .where(Card.column("project_column_id").in_([original_column.id, new_column.id]))
                    .with_for_update()
                ).all()

                db.exec(
                    shared_update_query.values({Card.order: Card.order - 1}).where(
                        (Card.column("order") >= original_order)
                        & (Card.column("project_column_id") == original_column.id)
                    )
                )

                db.exec(
                    shared_update_query.values({Card.order: Card.order + 1}).where(
                        (Card.column("order") >= order) & (Card.column("project_column_id") == new_column.id)
                    )
                )
            else:
                # Lock only the original column
                db.exec(
                    SqlBuilder.select.table(Card)
                    .where(Card.column("project_column_id") == original_column.id)
                    .with_for_update()
                ).all()

                update_query = ServiceHelper.set_order_in_column(shared_update_query, Card, original_order, order)
                update_query = update_query.where(Card.column("project_column_id") == original_column.id)
                db.exec(update_query)

            card.order = order
            db.update(card)

        await CardPublisher.order_changed(project, card, original_column, cast(ProjectColumn, new_column))

        if new_column:
            CardActivityTask.card_moved(user_or_bot, project, card, original_column)
            CardBotTask.card_moved(user_or_bot, project, card, original_column)

        return True

    async def update_assigned_users(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        assign_user_uids: list[str] | None = None,
    ) -> list[User] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        original_assigned_user_ids = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.column(CardAssignedUser.user_id).where(CardAssignedUser.card_id == card.id)
            )
            original_assigned_user_ids = result.all()

        users: list[User] = []
        if original_assigned_user_ids:
            with DbSession.use(readonly=False) as db:
                db.exec(SqlBuilder.delete.table(CardAssignedUser).where(CardAssignedUser.column("card_id") == card.id))

        raw_users = []
        if assign_user_uids:
            assign_user_ids = [SnowflakeID.from_short_code(uid) for uid in assign_user_uids]
            project_service = self._get_service(ProjectService)
            raw_users = await project_service.get_assigned_users(
                project, as_api=False, where_user_ids_in=assign_user_ids
            )

        if raw_users:
            for user, project_assigned_user in raw_users:
                with DbSession.use(readonly=False) as db:
                    db.insert(
                        CardAssignedUser(
                            project_assigned_id=project_assigned_user.id,
                            card_id=card.id,
                            user_id=user.id,
                        )
                    )
                    users.append(user)

        await CardPublisher.assigned_users_updated(project, card, users)

        notification_service = self._get_service(NotificationService)
        for user in users:
            if user.id in original_assigned_user_ids:
                continue
            await notification_service.notify_assigned_to_card(user_or_bot, user, project, card)

        CardActivityTask.card_assigned_users_updated(
            user_or_bot,
            project,
            card,
            [user_id for user_id in original_assigned_user_ids],
            [user.id for user in users],
        )

        return users

    async def update_labels(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        label_uids: list[str],
    ) -> bool | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        project_label_service = self._get_service(ProjectLabelService)

        original_labels = await project_label_service.get_all_by_card(card, as_api=False)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(CardAssignedProjectLabel).where(
                    CardAssignedProjectLabel.column("card_id") == card.id
                )
            )

        for label_uid in label_uids:
            label = ServiceHelper.get_by_param(ProjectLabel, label_uid)
            if not label or label.project_id != project.id:
                return None
            with DbSession.use(readonly=False) as db:
                db.insert(CardAssignedProjectLabel(card_id=card.id, project_label_id=label.id))

        labels = await project_label_service.get_all_by_card(card, as_api=False)

        await CardPublisher.labels_updated(project, card, labels)
        CardActivityTask.card_labels_updated(
            user_or_bot,
            project,
            card,
            [label.id for label in original_labels],
            [label.id for label in labels],
        )
        CardBotTask.card_labels_updated(user_or_bot, project, card)

        return True

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam) -> bool:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return False
        project, card = params

        if not card.archived_at:
            return False

        started_checkitems = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(Checkitem)
                .join(
                    Checklist,
                    Checkitem.column("checklist_id") == Checklist.column("id"),
                )
                .where(
                    (Checklist.column("card_id") == card.id) & (Checkitem.column("status") == CheckitemStatus.Started)
                )
            )
            started_checkitems = result.all()

        checkitem_service = self._get_service(CheckitemService)
        current_time = SafeDateTime.now()
        for checkitem in started_checkitems:
            await checkitem_service.change_status(
                user_or_bot,
                project,
                card,
                checkitem,
                CheckitemStatus.Stopped,
                current_time,
                should_publish=False,
            )

        with DbSession.use(readonly=False) as db:
            db.exec(SqlBuilder.delete.table(CardAssignedUser).where(CardAssignedUser.column("card_id") == card.id))

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(CardRelationship).where(
                    (CardRelationship.column("card_id_parent") == card.id)
                    | (CardRelationship.column("card_id_child") == card.id)
                )
            )

        bot_scope_service = self._get_service(BotScopeService)
        await bot_scope_service.delete_by_scope(CardBotScope, card)
        await BotScheduleHelper.unschedule_by_scope(CardBotSchedule, card)

        with DbSession.use(readonly=False) as db:
            db.delete(card)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(Card)
                .values({Card.order: Card.order - 1})
                .where(
                    (Card.column("project_id") == project.id)
                    & (Card.column("project_column_id") == card.project_column_id)
                    & (Card.column("order") > card.order)
                )
            )

        await CardPublisher.deleted(project, card)
        CardActivityTask.card_deleted(user_or_bot, project, card)
        CardBotTask.card_deleted(user_or_bot, project, card)

        return True
