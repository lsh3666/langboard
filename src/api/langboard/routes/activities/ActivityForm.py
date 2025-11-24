from langboard_shared.core.schema import TimeBasedPagination


class ActivityPagination(TimeBasedPagination):
    assignee_uid: str | None = None
    only_count: bool = False
