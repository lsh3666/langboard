from core.db import ApiField, SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotScopeModel, BotTriggerCondition
from .Project import Project


class ProjectBotScope(BaseBotScopeModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Project, nullable=False, index=True, api_field=ApiField(name="project_uid")
    )

    @staticmethod
    def get_available_conditions() -> set[BotTriggerCondition]:
        return {
            BotTriggerCondition.ProjectUpdated,
            BotTriggerCondition.ProjectDeleted,
            BotTriggerCondition.ProjectLabelCreated,
            BotTriggerCondition.ProjectLabelUpdated,
            BotTriggerCondition.ProjectLabelDeleted,
            BotTriggerCondition.ProjectWikiCreated,
            BotTriggerCondition.ProjectWikiUpdated,
            BotTriggerCondition.ProjectWikiPublicityChanged,
            BotTriggerCondition.ProjectWikiDeleted,
            BotTriggerCondition.ProjectColumnNameChanged,
            BotTriggerCondition.ProjectColumnDeleted,
            BotTriggerCondition.CardCreated,
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
        return "project_id"
