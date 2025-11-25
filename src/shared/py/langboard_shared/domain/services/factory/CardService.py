from typing import Any, Literal, Sequence, cast, overload
from ....ai import BotScheduleHelper, BotScopeHelper
from ....core.db import EditorContentModel
from ....core.domain import BaseDomainService
from ....core.domain.BaseDomainService import TMutableValidatorMap
from ....core.schema import TimeBasedPagination
from ....core.types import SafeDateTime, SnowflakeID
from ....core.types.ParamTypes import TCardParam, TColumnParam, TProjectLabelParam, TProjectParam, TUserOrBot
from ....core.utils.Converter import convert_python_data
from ....domain.models import (
    Card,
    CardAssignedProjectLabel,
    CardAssignedUser,
    CardBotSchedule,
    CardBotScope,
    Checkitem,
    Project,
    ProjectColumn,
    User,
)
from ....domain.models.Checkitem import CheckitemStatus
from ....helpers import InfraHelper
from ....publishers import CardPublisher
from ....tasks.activities import CardActivityTask
from ....tasks.bots import CardBotTask
from .CardRelationshipService import CardRelationshipService
from .CheckitemService import CheckitemService
from .NotificationService import NotificationService
from .ProjectLabelService import ProjectLabelService
from .ProjectService import ProjectService


class CardService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card"

    async def get_by_id_like(self, card: TCardParam | None) -> Card | None:
        card = InfraHelper.get_by_id_like(Card, card)
        return card

    async def get_details(self, project: TProjectParam | None, card: TCardParam | None) -> dict[str, Any] | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        column = InfraHelper.get_by_id_like(ProjectColumn, card.project_column_id)
        if not column:
            return None

        api_card = card.api_response()
        api_card["project_column_name"] = column.name

        project_service = self._get_service(ProjectService)
        api_card["project_members"] = await project_service.get_api_assigned_user_list(card.project_id)

        project_label_service = self._get_service(ProjectLabelService)
        api_card["labels"] = await project_label_service.get_api_list_by_card(card)

        api_card["member_uids"] = await self.get_api_assigned_user_list(card, only_uids=True)

        card_relationship_service = self._get_service(CardRelationshipService)
        api_card["relationships"] = await card_relationship_service.get_api_list_by_card(card)
        return api_card

    async def get_board_list(self, project: TProjectParam | None) -> list[dict[str, Any]]:
        project = InfraHelper.get_by_id_like(Project, project)
        if not project:
            return []

        raw_cards = self.repo.card.get_board_list(project)

        raw_members = self.repo.card_assigned_user.get_all_by_project(project)
        members: dict[int, list[str]] = {}
        for user, card_assigned_user in raw_members:
            if card_assigned_user.card_id not in members:
                members[card_assigned_user.card_id] = []
            members[card_assigned_user.card_id].append(user.get_uid())

        raw_relationships = self.repo.card_relationship.get_all_by_project(project)
        relationships: dict[int, list[dict[str, Any]]] = {}
        for relationship, _ in raw_relationships:
            if relationship.card_id_parent not in relationships:
                relationships[relationship.card_id_parent] = []
            if relationship.card_id_child not in relationships:
                relationships[relationship.card_id_child] = []
            relationships[relationship.card_id_parent].append(relationship.api_response())
            relationships[relationship.card_id_child].append(relationship.api_response())

        raw_labels = self.repo.project_label.get_all_card_labels_by_project(project)
        labels: dict[int, list[dict[str, Any]]] = {}
        for label, card_label in raw_labels:
            if card_label.card_id not in labels:
                labels[card_label.card_id] = []
            labels[card_label.card_id].append(label.api_response())

        cards = []
        for card, count_comment in raw_cards:
            api_card = card.api_response()
            api_card["count_comment"] = count_comment
            api_card["member_uids"] = members.get(card.id, [])
            api_card["relationships"] = relationships.get(card.id, [])
            api_card["labels"] = labels.get(card.id, [])
            cards.append(api_card)

        return cards

    async def get_dashboard_list(
        self, user: User, pagination: TimeBasedPagination
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        records = self.repo.card.get_dashboard_list_scroller(user, pagination)

        api_cards = []
        api_projects: dict[int, dict[str, Any]] = {}
        for card, project, column in records:
            api_card = card.api_response()
            api_card["project_column_name"] = column.name
            if project.id not in api_projects:
                api_projects[project.id] = project.api_response()
            api_cards.append(api_card)
        return api_cards, list(api_projects.values())

    async def get_api_list_by_project(self, project: TProjectParam | None) -> list[dict[str, Any]]:
        project = InfraHelper.get_by_id_like(Project, project)
        if not project:
            return []

        records = self.repo.card.get_all_by_project(project)
        cards = []
        for card, column in records:
            api_card = card.api_response()
            api_card["project_column_name"] = column.name
            cards.append(api_card)
        return cards

    async def get_api_list_by_column(self, column: TColumnParam | None) -> list[dict[str, Any]]:
        column = InfraHelper.get_by_id_like(ProjectColumn, column)
        if not column:
            return []

        records = self.repo.card.get_all_by_column(column)
        return [card.api_response() for card in records]

    @overload
    async def get_api_assigned_user_list(
        self, card: TCardParam | None, only_uids: Literal[False] = False
    ) -> list[dict[str, Any]]: ...
    @overload
    async def get_api_assigned_user_list(self, card: TCardParam | None, only_uids: Literal[True]) -> list[str]: ...
    async def get_api_assigned_user_list(
        self, card: TCardParam | None, only_uids: bool = False
    ) -> list[dict[str, Any]] | list[str]:
        card = InfraHelper.get_by_id_like(Card, card)
        if not card:
            return []

        raw_users = self.repo.card_assigned_user.get_all_by_card(card, only_ids=only_uids)
        if only_uids:
            users = [cast(SnowflakeID, user).to_short_code() for user, _ in raw_users]
        else:
            users = [cast(User, user).api_response() for user, _ in raw_users]
        return users

    async def get_api_bot_scope_list(
        self, project: TProjectParam | None, card: TCardParam | None
    ) -> list[dict[str, Any]]:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return []
        project, card = params

        scopes = BotScopeHelper.get_list(CardBotScope, card_id=card.id)
        return [scope.api_response() for scope in scopes]

    async def get_api_bot_schedule_list(
        self, project: TProjectParam | None, card: TCardParam | None
    ) -> list[dict[str, Any]]:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return []
        project, card = params

        schedules = await BotScheduleHelper.get_all_by_scope(CardBotSchedule, None, card, as_api=True)

        return schedules

    async def create(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam | None,
        column: TColumnParam | None,
        title: str,
        description: EditorContentModel | None = None,
        assign_user_uids: list[str] | None = None,
    ) -> tuple[Card, dict[str, Any]] | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
        if not params:
            return None
        project, column = params
        if column.is_archive:
            return None

        card = Card(
            project_id=project.id,
            project_column_id=column.id,
            title=title,
            description=description or EditorContentModel(),
            order=self.repo.card.get_next_order(column, {"project_id": project.id}),
        )
        self.repo.card.insert(card)

        users: list[User] = []
        if assign_user_uids:
            raw_users = self.repo.project_assigned_user.get_all_by_project(project, where_users_in=assign_user_uids)
            for assign_user, project_assigned_user in raw_users:
                card_assigned_user = CardAssignedUser(
                    project_assigned_id=project_assigned_user.id,
                    card_id=card.id,
                    user_id=assign_user.id,
                )
                users.append(assign_user)
                self.repo.card_assigned_user.insert(card_assigned_user)

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
        self, user_or_bot: TUserOrBot, project: TProjectParam | None, card: TCardParam | None, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        validators: TMutableValidatorMap = {
            "title": "not_empty",
            "deadline_at": "default",
            "description": "default",
        }
        old_record = self.apply_mutates(card, form, validators)
        if not old_record:
            return True

        checkitem_cardified_from = None
        if "title" in old_record:
            checkitem_cardified_from = InfraHelper.get_by(Checkitem, "cardified_id", card.id)
            if checkitem_cardified_from:
                checkitem_cardified_from.title = card.title
                self.repo.checkitem.update(checkitem_cardified_from)

        self.repo.card.update(card)

        model: dict[str, Any] = {}
        for key in form:
            if key not in validators or key not in old_record:
                continue
            model[key] = convert_python_data(getattr(card, key))

        await CardPublisher.updated(project, card, checkitem_cardified_from, model)

        if "description" in model and card.description:
            notification_service = self._get_service(NotificationService)
            await notification_service.notify_mentioned_in_card(user_or_bot, project, card)

        CardActivityTask.card_updated(user_or_bot, project, old_record, card)
        CardBotTask.card_updated(user_or_bot, project, card)

        return model

    async def change_order(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam | None,
        card: TCardParam | None,
        order: int,
        new_column: TColumnParam | None | None,
    ) -> bool | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        old_column = None
        old_column = InfraHelper.get_by_id_like(ProjectColumn, card.project_column_id)
        if not old_column or old_column.project_id != project.id:
            return None

        if new_column:
            new_column = InfraHelper.get_by_id_like(ProjectColumn, new_column)
            if not new_column or new_column.project_id != card.project_id:
                return None

            card.project_column_id = new_column.id
            card.archived_at = SafeDateTime.now() if new_column.is_archive else None

        old_order = card.order
        card.order = order
        self.repo.card.update_row_order(card, old_column, old_order, order, new_column)
        self.repo.card.update(card)

        await CardPublisher.order_changed(project, card, old_column, cast(ProjectColumn, new_column))

        if new_column:
            CardActivityTask.card_moved(user_or_bot, project, card, old_column)
            CardBotTask.card_moved(user_or_bot, project, card, old_column)

        return True

    async def update_assigned_users(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam | None,
        card: TCardParam | None,
        assign_user_uids: list[str] | None = None,
    ) -> list[User] | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        old_assigned_users = self.repo.card_assigned_user.get_all_by_card(card, only_ids=True)
        old_assigned_user_ids = [user_id for user_id, _ in old_assigned_users]

        if old_assigned_user_ids:
            self.repo.card_assigned_user.delete_all_by_card(card)

        raw_users = []
        if assign_user_uids:
            raw_users = self.repo.project_assigned_user.get_all_by_project(project, where_users_in=assign_user_uids)

        new_users: list[User] = []
        if raw_users:
            for user, project_assigned_user in raw_users:
                card_assigned_user = CardAssignedUser(
                    project_assigned_id=project_assigned_user.id,
                    card_id=card.id,
                    user_id=user.id,
                )
                self.repo.card_assigned_user.insert(card_assigned_user)
                new_users.append(user)

        await CardPublisher.assigned_users_updated(project, card, new_users)

        notification_service = self._get_service(NotificationService)
        for user in new_users:
            if user.id in old_assigned_user_ids:
                continue
            await notification_service.notify_assigned_to_card(user_or_bot, user, project, card)

        CardActivityTask.card_assigned_users_updated(
            user_or_bot,
            project,
            card,
            old_assigned_user_ids,
            [user.id for user in new_users],
        )
        return new_users

    async def update_labels(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam | None,
        card: TCardParam | None,
        labels: Sequence[TProjectLabelParam],
    ) -> bool | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        old_labels = self.repo.project_label.get_all_by_card(card)

        self.repo.card_assigned_project_label.delete_all_by_card(card)

        new_labels = self.repo.project_label.get_all_by_project(project, where_in=labels)
        for label in new_labels:
            card_assigned_label = CardAssignedProjectLabel(card_id=card.id, project_label_id=label.id)
            self.repo.card_assigned_project_label.insert(card_assigned_label)

        new_labels = self.repo.project_label.get_all_by_card(card)

        await CardPublisher.labels_updated(project, card, new_labels)
        CardActivityTask.card_labels_updated(
            user_or_bot,
            project,
            card,
            [label.id for label in old_labels],
            [label.id for label in new_labels],
        )
        CardBotTask.card_labels_updated(user_or_bot, project, card)

        return True

    async def archive(
        self, user_or_bot: TUserOrBot, project: TProjectParam | None, card: TCardParam | None
    ) -> bool | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        if card.archived_at:
            return True

        column_archive = self.repo.project_column.get_or_create_archive_if_not_exists(project.id)

        await self.change_order(user_or_bot, project, card, 0, column_archive)

        return True

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam | None, card: TCardParam | None) -> bool:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return False
        project, card = params

        if not card.archived_at:
            return False

        started_checkitems = self.repo.checkitem.get_all_started_checkitem_by_card(card)

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

        self.repo.card_assigned_user.delete_all_by_card(card)
        self.repo.card_relationship.delete_all_by_card(card)

        BotScopeHelper.delete_by_scope(CardBotScope, card)
        await BotScheduleHelper.unschedule_by_scope(CardBotSchedule, card)

        self.repo.card.delete(card)
        self.repo.card.reoder_after_delete(card.project_column_id, card.order)

        await CardPublisher.deleted(project, card)
        CardActivityTask.card_deleted(user_or_bot, project, card)
        CardBotTask.card_deleted(user_or_bot, project, card)

        return True
