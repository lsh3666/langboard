from langboard_shared.core.schema import Pagination
from langboard_shared.core.types import SafeDateTime


class BotLogPagination(Pagination):
    refer_time: SafeDateTime = SafeDateTime.now()
