from ....core.domain import BaseRepository
from ....domain.models import ApiKeyUsage


class ApiKeyUsageRepository(BaseRepository[ApiKeyUsage]):
    @staticmethod
    def model_cls():
        return ApiKeyUsage

    @staticmethod
    def name() -> str:
        return "api_key_usage"
