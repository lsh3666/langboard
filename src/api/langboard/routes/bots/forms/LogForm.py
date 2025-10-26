from core.schema import Pagination
from core.types import SafeDateTime


class BotLogPagination(Pagination):
    refer_time: SafeDateTime = SafeDateTime.now()
