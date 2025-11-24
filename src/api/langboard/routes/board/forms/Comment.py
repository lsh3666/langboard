from langboard_shared.core.routing import BaseFormModel, form_model
from langboard_shared.domain.models.bases import REACTION_TYPES
from pydantic import Field


@form_model
class ToggleCardCommentReactionForm(BaseFormModel):
    reaction: str = Field(..., description=f"Reaction type: {', '.join(REACTION_TYPES)}")
