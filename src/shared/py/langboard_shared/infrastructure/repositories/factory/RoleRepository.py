from typing import Callable
from ....core.domain import BaseRepository
from ....core.types import Factory
from . import roles as factory


class RoleRepository(BaseRepository, Factory):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "role"

    def __init__(self, get_repository: Callable, get_repository_by_name: Callable):
        BaseRepository.__init__(self, get_repository, get_repository_by_name)
        Factory.__init__(self)

    @property
    def project(self):
        return self._create_or_get_product(factory.ProjectRoleRepository)
