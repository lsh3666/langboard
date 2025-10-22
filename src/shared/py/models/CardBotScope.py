from core.db import ApiField, SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotScopeModel, BotTriggerCondition
from .Card import Card


class CardBotScope(BaseBotScopeModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Card, nullable=False, index=True, api_field=ApiField(name="card_uid")
    )

    @staticmethod
    def get_available_conditions() -> set[BotTriggerCondition]:
        return {
            BotTriggerCondition.CardUpdated,
            BotTriggerCondition.CardMoved,
            BotTriggerCondition.CardLabelsUpdated,
            BotTriggerCondition.CardRelationshipsUpdated,
            BotTriggerCondition.CardDeleted,
            BotTriggerCondition.CardAttachmentUploaded,
            BotTriggerCondition.CardAttachmentNameChanged,
            BotTriggerCondition.CardAttachmentDeleted,
            BotTriggerCondition.CardCommentAdded,
            BotTriggerCondition.CardCommentUpdated,
            BotTriggerCondition.CardCommentDeleted,
            BotTriggerCondition.CardCommentReacted,
            BotTriggerCondition.CardCommentUnreacted,
            BotTriggerCondition.CardChecklistCreated,
            BotTriggerCondition.CardChecklistTitleChanged,
            BotTriggerCondition.CardChecklistChecked,
            BotTriggerCondition.CardChecklistUnchecked,
            BotTriggerCondition.CardChecklistDeleted,
            BotTriggerCondition.CardCheckitemCreated,
            BotTriggerCondition.CardCheckitemTitleChanged,
            BotTriggerCondition.CardCheckitemTimerStarted,
            BotTriggerCondition.CardCheckitemTimerPaused,
            BotTriggerCondition.CardCheckitemTimerStopped,
            BotTriggerCondition.CardCheckitemChecked,
            BotTriggerCondition.CardCheckitemUnchecked,
            BotTriggerCondition.CardCheckitemCardified,
            BotTriggerCondition.CardCheckitemDeleted,
        }

    @staticmethod
    def get_scope_column_name() -> str:
        return "card_id"
