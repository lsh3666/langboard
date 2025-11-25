from ....core.domain import BaseRepository
from ....domain.models import GlobalCardRelationshipType


class GlobalCardRelationshipTypeRepository(BaseRepository[GlobalCardRelationshipType]):
    @staticmethod
    def model_cls():
        return GlobalCardRelationshipType

    @staticmethod
    def name() -> str:
        return "global_card_relationship_type"
