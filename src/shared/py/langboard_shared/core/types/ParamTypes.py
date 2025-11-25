from ...domain.models import (
    AppSetting,
    Bot,
    Card,
    CardAttachment,
    CardComment,
    ChatHistory,
    ChatSession,
    ChatTemplate,
    Checkitem,
    Checklist,
    GlobalCardRelationshipType,
    InternalBot,
    Project,
    ProjectColumn,
    ProjectLabel,
    ProjectWiki,
    User,
    UserGroup,
    UserNotification,
)
from .SnowflakeID import SnowflakeID


TBaseParam = SnowflakeID | int | str

TUserOrBot = User | Bot
TUserOrBotParam = User | Bot | TBaseParam
TProjectParam = Project | TBaseParam
TColumnParam = ProjectColumn | TBaseParam
TCardParam = Card | TBaseParam
TAttachmentParam = CardAttachment | TBaseParam
TCommentParam = CardComment | TBaseParam
TChecklistParam = Checklist | TBaseParam
TCheckitemParam = Checkitem | TBaseParam
TChatSessionParam = ChatSession | TBaseParam
TChatHistoryParam = ChatHistory | TBaseParam
TWikiParam = ProjectWiki | TBaseParam
TUserParam = User | TBaseParam
TUserGroupParam = UserGroup | TBaseParam
TProjectLabelParam = ProjectLabel | TBaseParam
TBotParam = Bot | TBaseParam
TSettingParam = AppSetting | TBaseParam
TGlobalCardRelationshipTypeParam = GlobalCardRelationshipType | TBaseParam
TNotificationParam = UserNotification | TBaseParam
TChatTemplateParam = ChatTemplate | TBaseParam
TInternalBotParam = InternalBot | TBaseParam
