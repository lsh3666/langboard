from ....core.domain import BaseRepository
from ....domain.models import McpToolGroupUsage


class McpToolGroupUsageRepository(BaseRepository[McpToolGroupUsage]):
    @staticmethod
    def model_cls():
        return McpToolGroupUsage

    @staticmethod
    def name() -> str:
        return "mcp_tool_group_usage"
