from langboard_shared.core.schema import Pagination
from langboard_shared.core.types import SafeDateTime


class ActivityPagination(Pagination):
    assignee_uid: str | None = None
    refer_time: SafeDateTime = SafeDateTime.now()
    only_count: bool = False
