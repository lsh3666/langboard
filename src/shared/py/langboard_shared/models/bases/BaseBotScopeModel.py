from abc import abstractmethod
from enum import Enum
from typing import Any
from ...core.db import ApiField, BaseSqlModel, CSVType, Field, SnowflakeIDField
from ...core.types import SnowflakeID
from ..Bot import Bot


class BotTriggerCondition(Enum):
    # Project
    ProjectUpdated = "project_updated"
    ProjectDeleted = "project_deleted"

    # Project Label
    ProjectLabelCreated = "project_label_created"
    ProjectLabelUpdated = "project_label_updated"
    ProjectLabelDeleted = "project_label_deleted"

    # Project Wiki
    ProjectWikiCreated = "project_wiki_created"
    ProjectWikiUpdated = "project_wiki_updated"
    ProjectWikiPublicityChanged = "project_wiki_publicity_changed"
    ProjectWikiDeleted = "project_wiki_deleted"

    # Project Column
    ProjectColumnNameChanged = "project_column_name_changed"
    ProjectColumnDeleted = "project_column_deleted"

    # Card
    CardCreated = "card_created"
    CardUpdated = "card_updated"
    CardMoved = "card_moved"
    CardLabelsUpdated = "card_labels_updated"
    CardRelationshipsUpdated = "card_relationships_updated"
    CardDeleted = "card_deleted"

    # Card Attachment
    CardAttachmentUploaded = "card_attachment_uploaded"
    CardAttachmentNameChanged = "card_attachment_name_changed"
    CardAttachmentDeleted = "card_attachment_deleted"

    # Card Comment
    CardCommentAdded = "card_comment_added"
    CardCommentUpdated = "card_comment_updated"
    CardCommentDeleted = "card_comment_deleted"
    CardCommentReacted = "card_comment_reacted"
    CardCommentUnreacted = "card_comment_unreacted"

    # Card Checklist
    CardChecklistCreated = "card_checklist_created"
    CardChecklistTitleChanged = "card_checklist_title_changed"
    CardChecklistChecked = "card_checklist_checked"
    CardChecklistUnchecked = "card_checklist_unchecked"
    CardChecklistDeleted = "card_checklist_deleted"

    # Card Checkitem
    CardCheckitemCreated = "card_checkitem_created"
    CardCheckitemTitleChanged = "card_checkitem_title_changed"
    CardCheckitemTimerStarted = "card_checkitem_timer_started"
    CardCheckitemTimerPaused = "card_checkitem_timer_paused"
    CardCheckitemTimerStopped = "card_checkitem_timer_stopped"
    CardCheckitemChecked = "card_checkitem_checked"
    CardCheckitemUnchecked = "card_checkitem_unchecked"
    CardCheckitemCardified = "card_checkitem_cardified"
    CardCheckitemDeleted = "card_checkitem_deleted"


class BaseBotScopeModel(BaseSqlModel):
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot, index=True, api_field=ApiField(name="bot_uid"))
    conditions: list[BotTriggerCondition] = Field(
        nullable=False, sa_type=CSVType(BotTriggerCondition), api_field=ApiField()
    )

    @staticmethod
    @abstractmethod
    def get_available_conditions() -> set[BotTriggerCondition]: ...

    @staticmethod
    @abstractmethod
    def get_scope_column_name() -> str: ...

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        keys: list[str | tuple[str, str]] = ["bot_id"]
        keys.append(self.get_scope_column_name())
        return keys
