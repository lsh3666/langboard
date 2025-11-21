from ....core.domain import BaseOrderRepository
from ....core.types.ParamTypes import TUserParam
from ....domain.models import User, UserGroup
from ....helpers import InfraHelper


class UserGroupRepository(BaseOrderRepository[UserGroup, User]):
    @staticmethod
    def parent_model_cls():
        return User

    @staticmethod
    def model_cls():
        return UserGroup

    @staticmethod
    def name() -> str:
        return "user_group"

    def get_all_by_user(self, user: TUserParam) -> list[UserGroup]:
        user_id = InfraHelper.convert_id(user)
        groups = InfraHelper.get_all_by(UserGroup, "user_id", user_id)
        return groups
