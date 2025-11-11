from contextlib import contextmanager
from fastapi import Depends
from ..core.service import ServiceFactory
from . import factory


class Service(ServiceFactory):
    @staticmethod
    def scope() -> "Service":
        async def create_factory():
            service = Service()
            try:
                yield service
            finally:
                service.close()

        return Depends(create_factory)

    @staticmethod
    @contextmanager
    def use():
        service = Service()
        yield service
        service.close()

    def close(self):
        self._services.clear()

    @property
    def user(self):
        return self._create_or_get_service(factory.UserService)

    @property
    def project(self):
        return self._create_or_get_service(factory.ProjectService)

    @property
    def role(self):
        return self._create_or_get_service(factory.RoleService)

    @property
    def email(self):
        return self._create_or_get_service(factory.EmailService)

    @property
    def chat(self):
        return self._create_or_get_service(factory.ChatService)

    @property
    def project_column(self):
        return self._create_or_get_service(factory.ProjectColumnService)

    @property
    def card(self):
        return self._create_or_get_service(factory.CardService)

    @property
    def user_group(self):
        return self._create_or_get_service(factory.UserGroupService)

    @property
    def checklist(self):
        return self._create_or_get_service(factory.ChecklistService)

    @property
    def checkitem(self):
        return self._create_or_get_service(factory.CheckitemService)

    @property
    def reaction(self):
        return self._create_or_get_service(factory.ReactionService)

    @property
    def card_comment(self):
        return self._create_or_get_service(factory.CardCommentService)

    @property
    def card_attachment(self):
        return self._create_or_get_service(factory.CardAttachmentService)

    @property
    def project_invitation(self):
        return self._create_or_get_service(factory.ProjectInvitationService)

    @property
    def project_wiki(self):
        return self._create_or_get_service(factory.ProjectWikiService)

    @property
    def project_label(self):
        return self._create_or_get_service(factory.ProjectLabelService)

    @property
    def card_relationship(self):
        return self._create_or_get_service(factory.CardRelationshipService)

    @property
    def app_setting(self):
        return self._create_or_get_service(factory.AppSettingService)

    @property
    def notification(self):
        return self._create_or_get_service(factory.NotificationService)

    @property
    def activity(self):
        return self._create_or_get_service(factory.ActivityService)

    @property
    def user_notification_setting(self):
        return self._create_or_get_service(factory.UserNotificationSettingService)

    @property
    def bot(self):
        return self._create_or_get_service(factory.BotService)

    @property
    def metadata(self):
        return self._create_or_get_service(factory.MetadataService)

    @property
    def internal_bot(self):
        return self._create_or_get_service(factory.InternalBotService)

    @property
    def bot_scope(self):
        return self._create_or_get_service(factory.BotScopeService)

    @property
    def bot_log(self):
        return self._create_or_get_service(factory.BotLogService)
