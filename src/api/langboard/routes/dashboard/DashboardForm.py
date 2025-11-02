from langboard_shared.core.routing import BaseFormModel, form_model
from langboard_shared.core.schema import Pagination
from langboard_shared.core.types import SafeDateTime


@form_model
class DashboardProjectCreateForm(BaseFormModel):
    title: str
    description: str | None = None
    project_type: str = "Other"


class DashboardPagination(Pagination):
    refer_time: SafeDateTime = SafeDateTime.now()
