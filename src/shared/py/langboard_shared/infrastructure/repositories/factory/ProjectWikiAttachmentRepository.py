from ....core.domain import BaseOrderRepository
from ....domain.models import ProjectWiki, ProjectWikiAttachment


class ProjectWikiAttachmentRepository(BaseOrderRepository[ProjectWikiAttachment, ProjectWiki]):
    @staticmethod
    def parent_model_cls():
        return ProjectWiki

    @staticmethod
    def model_cls():
        return ProjectWikiAttachment

    @staticmethod
    def name() -> str:
        return "project_wiki_attachment"
