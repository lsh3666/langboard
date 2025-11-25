from typing import Any, Literal, TypeVar, overload
from ....core.db import BaseSqlModel
from ....core.domain import BaseDomainService
from ....domain.models.bases import BaseMetadataModel


_TMetadata = TypeVar("_TMetadata", bound=BaseMetadataModel)


class MetadataService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "metadata"

    @overload
    async def get_all_as_api(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, as_dict: Literal[False]
    ) -> list[dict[str, Any]]: ...
    @overload
    async def get_all_as_api(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, as_dict: Literal[True]
    ) -> dict[str, Any]: ...
    async def get_all_as_api(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, as_dict: bool = False
    ) -> list[dict[str, Any]] | dict[str, Any]:
        metadata_list = self.repo.metadata.get_list(model, foreign_model)
        if not as_dict:
            return [metadata.api_response() for metadata in metadata_list]

        metadata = {}
        for data in metadata_list:
            metadata[data.key] = data.value
        return metadata

    async def get_by_key_as_api(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, key: str
    ) -> dict[str, Any] | None:
        metadata = self.repo.metadata.get_by_key(model, foreign_model, key)
        return metadata.api_response() if metadata else None

    async def save(
        self, model: type[_TMetadata], foreign_model: BaseSqlModel, key: str, value: str, old_key: str | None = None
    ) -> _TMetadata | None:
        metadata = self.repo.metadata.save(model, foreign_model, key, value, old_key)
        return metadata

    async def delete(self, model: type[_TMetadata], foreign_model: BaseSqlModel, keys: str | list[str]) -> bool:
        return self.repo.metadata.delete(model, foreign_model, keys)
