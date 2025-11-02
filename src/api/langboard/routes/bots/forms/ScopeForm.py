from langboard_shared.core.routing import BaseFormModel, form_model
from langboard_shared.models import Card, ProjectColumn
from langboard_shared.models.bases import BotTriggerCondition
from pydantic import Field


@form_model
class CreateBotScopeForm(BaseFormModel):
    target_table: str = Field(..., title=f"Target table name ({ProjectColumn.__tablename__}, {Card.__tablename__})")
    target_uid: str = Field(..., title="Target UID")
    conditions: list[BotTriggerCondition] = Field(default=[], title="List of conditions for the bot trigger")


@form_model
class ToggleBotTriggerConditionForm(BaseFormModel):
    target_table: str = Field(..., title=f"Target table name ({ProjectColumn.__tablename__}, {Card.__tablename__})")
    condition: BotTriggerCondition


@form_model
class DeleteBotScopeForm(BaseFormModel):
    target_table: str = Field(..., title=f"Target table name ({ProjectColumn.__tablename__}, {Card.__tablename__})")
