import ApiKeyRole from "@/models/ApiKeyRole";
import Bot from "@/models/Bot";
import Card from "@/models/Card";
import ChatHistory from "@/models/ChatHistory";
import ChatSession from "@/models/ChatSession";
import InternalBot from "@/models/InternalBot";
import McpRole from "@/models/McpRole";
import ProjectAssignedInternalBot from "@/models/ProjectAssignedInternalBot";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import ProjectChatSession from "@/models/ProjectChatSession";
import ProjectRole from "@/models/ProjectRole";
import ProjectWiki from "@/models/ProjectWiki";
import ProjectWikiAssignedUser from "@/models/ProjectWikiAssignedUser";
import SettingRole from "@/models/SettingRole";
import User from "@/models/User";
import UserNotification from "@/models/UserNotification";
import UserNotificationUnsubscription from "@/models/UserNotificationUnsubscription";

export const ALL_ENTITIES = [
    ApiKeyRole,
    Bot,
    Card,
    ChatHistory,
    ChatSession,
    InternalBot,
    McpRole,
    ProjectAssignedUser,
    ProjectAssignedInternalBot,
    ProjectChatSession,
    ProjectRole,
    ProjectWiki,
    ProjectWikiAssignedUser,
    SettingRole,
    User,
    UserNotification,
    UserNotificationUnsubscription,
];
