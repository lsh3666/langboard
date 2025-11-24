from ...core.types import Factory
from . import factory


class Repository(Factory):
    @property
    def user(self):
        return self._create_or_get_product(factory.UserRepository)

    @property
    def project(self):
        return self._create_or_get_product(factory.ProjectRepository)

    @property
    def role(self):
        return self._create_or_get_product(factory.RoleRepository)

    @property
    def project_column(self):
        return self._create_or_get_product(factory.ProjectColumnRepository)

    @property
    def card(self):
        return self._create_or_get_product(factory.CardRepository)

    @property
    def project_label(self):
        return self._create_or_get_product(factory.ProjectLabelRepository)

    @property
    def user_group(self):
        return self._create_or_get_product(factory.UserGroupRepository)

    @property
    def checklist(self):
        return self._create_or_get_product(factory.ChecklistRepository)

    @property
    def checkitem(self):
        return self._create_or_get_product(factory.CheckitemRepository)

    @property
    def card_attachment(self):
        return self._create_or_get_product(factory.CardAttachmentRepository)

    @property
    def card_comment(self):
        return self._create_or_get_product(factory.CardCommentRepository)

    @property
    def card_relationship(self):
        return self._create_or_get_product(factory.CardRelationshipRepository)

    @property
    def bot(self):
        return self._create_or_get_product(factory.BotRepository)

    @property
    def bot_log(self):
        return self._create_or_get_product(factory.BotLogRepository)

    @property
    def app_setting(self):
        return self._create_or_get_product(factory.AppSettingRepository)

    @property
    def global_card_relationship_type(self):
        return self._create_or_get_product(factory.GlobalCardRelationshipTypeRepository)

    @property
    def activity(self):
        return self._create_or_get_product(factory.ActivityRepository)

    @property
    def internal_bot(self):
        return self._create_or_get_product(factory.InternalBotRepository)

    @property
    def metadata(self):
        return self._create_or_get_product(factory.MetadataRepository)

    @property
    def user_notification(self):
        return self._create_or_get_product(factory.UserNotificationRepository)

    @property
    def project_invitation(self):
        return self._create_or_get_product(factory.ProjectInvitationRepository)

    @property
    def reaction(self):
        return self._create_or_get_product(factory.ReactionRepository)

    @property
    def user_notification_setting(self):
        return self._create_or_get_product(factory.UserNotificationSettingRepository)

    @property
    def user_profile(self):
        return self._create_or_get_product(factory.UserProfileRepository)

    @property
    def user_email(self):
        return self._create_or_get_product(factory.UserEmailRepository)

    @property
    def project_assigned_user(self):
        return self._create_or_get_product(factory.ProjectAssignedUserRepository)

    @property
    def user_group_assigned_email(self):
        return self._create_or_get_product(factory.UserGroupAssignedEmailRepository)

    @property
    def project_wiki(self):
        return self._create_or_get_product(factory.ProjectWikiRepository)

    @property
    def project_wiki_assigned_user(self):
        return self._create_or_get_product(factory.ProjectWikiAssignedUserRepository)

    @property
    def project_wiki_attachment(self):
        return self._create_or_get_product(factory.ProjectWikiAttachmentRepository)

    @property
    def project_assigned_internal_bot(self):
        return self._create_or_get_product(factory.ProjectAssignedInternalBotRepository)

    @property
    def chat_history(self):
        return self._create_or_get_product(factory.ChatHistoryRepository)

    @property
    def chat_session(self):
        return self._create_or_get_product(factory.ChatSessionRepository)

    @property
    def chat_template(self):
        return self._create_or_get_product(factory.ChatTemplateRepository)

    @property
    def card_assigned_user(self):
        return self._create_or_get_product(factory.CardAssignedUserRepository)

    @property
    def card_assigned_project_label(self):
        return self._create_or_get_product(factory.CardAssignedProjectLabelRepository)

    @property
    def checkitem_timer_record(self):
        return self._create_or_get_product(factory.CheckitemTimerRecordRepository)
