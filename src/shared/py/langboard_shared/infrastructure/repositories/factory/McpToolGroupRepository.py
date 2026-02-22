from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TUserParam
from ....domain.models import McpToolGroup
from ....helpers import InfraHelper


class McpToolGroupRepository(BaseRepository[McpToolGroup]):
    @staticmethod
    def model_cls():
        return McpToolGroup

    @staticmethod
    def name() -> str:
        return "mcp_tool_group"

    def get_list_by_user(self, user: TUserParam) -> list[McpToolGroup]:
        user_id = InfraHelper.convert_id(user)
        results = []
        with DbSession.use(readonly=True) as db:
            results = db.exec(
                SqlBuilder.select.table(McpToolGroup).where(McpToolGroup.column("user_id") == user_id)
            ).all()
        return results

    def get_global_list(self) -> list[McpToolGroup]:
        """Get only global tool groups (user_id IS NULL)"""
        results = []
        with DbSession.use(readonly=True) as db:
            results = db.exec(
                SqlBuilder.select.table(McpToolGroup).where(McpToolGroup.column("user_id") == None)  # noqa: E711
            ).all()
        return results
