from ....core.utils.Extractor import extract_func_param
from ....models import ProjectRole
from .BaseRoleService import BaseRoleService


class ProjectRoleService(BaseRoleService[ProjectRole]):
    def __init__(self):
        super().__init__(ProjectRole)

    @extract_func_param(4)(ProjectRole)  # type: ignore
    async def get_list(self, **kwargs):
        return await super().get_list(**kwargs)

    @extract_func_param(4)(ProjectRole)  # type: ignore
    async def get_one(self, **kwargs):
        return await super().get_one(**kwargs)

    @extract_func_param(3)(ProjectRole)  # type: ignore
    async def grant(self, **kwargs):
        return await super().grant(**kwargs)

    @extract_func_param(4)(ProjectRole)  # type: ignore
    async def grant_all(self, **kwargs):
        return await super().grant_all(**kwargs)

    @extract_func_param(4)(ProjectRole)  # type: ignore
    async def grant_default(self, **kwargs):
        return await super().grant_default(**kwargs)

    @extract_func_param(4)(ProjectRole)  # type: ignore
    async def withdraw(self, **kwargs):
        return await super().withdraw(**kwargs)
