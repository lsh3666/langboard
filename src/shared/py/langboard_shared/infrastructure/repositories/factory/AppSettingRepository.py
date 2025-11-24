from ....core.domain import BaseRepository
from ....domain.models import AppSetting


class AppSettingRepository(BaseRepository[AppSetting]):
    @staticmethod
    def model_cls():
        return AppSetting

    @staticmethod
    def name() -> str:
        return "app_setting"
