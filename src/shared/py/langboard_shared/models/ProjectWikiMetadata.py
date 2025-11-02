from ..core.db import ApiField, SnowflakeIDField
from ..core.types import SnowflakeID
from .bases import BaseMetadataModel
from .ProjectWiki import ProjectWiki


class ProjectWikiMetadata(BaseMetadataModel, table=True):
    project_wiki_id: SnowflakeID = SnowflakeIDField(
        foreign_key=ProjectWiki, index=True, api_field=ApiField(name="project_wiki_uid")
    )

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_wiki_id", "key"]
