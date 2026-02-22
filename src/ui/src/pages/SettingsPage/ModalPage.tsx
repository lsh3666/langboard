import { ROUTES } from "@/core/routing/constants";
import { memo, useState } from "react";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { McpToolGroup } from "@/core/models";
import BotCreateFormDialog from "@/pages/SettingsPage/components/bots/BotCreateFormDialog";
import InternalBotCreateFormDialog from "@/pages/SettingsPage/components/internalBots/InternalBotCreateFormDialog";
import ApiKeyCreateFormDialog from "@/pages/SettingsPage/components/apiKeys/ApiKeyCreateFormDialog";
import GlobalRelationshipCreateFormDialog from "@/pages/SettingsPage/components/relationships/GlobalRelationshipCreateFormDialog";
import UserCreateFormDialog from "@/pages/SettingsPage/components/users/UserCreateFormDialog";
import WebhookCreateFormDialog from "@/pages/SettingsPage/components/webhook/WebhookCreateFormDialog";
import McpToolGroupCreateFormDialog from "@/pages/SettingsPage/components/mcpToolGroups/McpToolGroupCreateFormDialog";

const ModalPage = memo(() => {
    const navigate = usePageNavigateRef();
    const [isOpened, setIsOpened] = useState(true);
    const pathname = location.pathname;

    const moveToBack = () => {
        if (pathname.startsWith(ROUTES.SETTINGS.CREATE_MCP_TOOL_GROUP(""))) {
            navigate(ROUTES.SETTINGS.MCP_TOOL_GROUPS);
            return;
        }

        switch (pathname) {
            case ROUTES.SETTINGS.CREATE_API_KEY:
                navigate(ROUTES.SETTINGS.API_KEYS);
                break;
            case ROUTES.SETTINGS.CREATE_USER:
                navigate(ROUTES.SETTINGS.USERS);
                break;
            case ROUTES.SETTINGS.CREATE_BOT:
                navigate(ROUTES.SETTINGS.BOTS);
                break;
            case ROUTES.SETTINGS.CREATE_INTERNAL_BOT:
                navigate(ROUTES.SETTINGS.INTERNAL_BOTS);
                break;
            case ROUTES.SETTINGS.CREATE_GLOBAL_RELATIONSHIP:
                navigate(ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS);
                break;
            case ROUTES.SETTINGS.CREATE_WEBHOOK:
                navigate(ROUTES.SETTINGS.WEBHOOKS);
                break;
            default:
                navigate(ROUTES.SETTINGS.ROUTE);
                break;
        }
    };

    const changeIsOpenedState = (opened: bool) => {
        if (!opened) {
            moveToBack();
        }
        setIsOpened(opened);
    };

    let modalContent;
    switch (pathname) {
        case ROUTES.SETTINGS.CREATE_API_KEY:
            modalContent = <ApiKeyCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_USER:
            modalContent = <UserCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_BOT:
            modalContent = <BotCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_INTERNAL_BOT:
            modalContent = <InternalBotCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_GLOBAL_RELATIONSHIP:
            modalContent = <GlobalRelationshipCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_WEBHOOK:
            modalContent = <WebhookCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        default:
            modalContent = null;
            break;
    }

    if (pathname.startsWith(ROUTES.SETTINGS.CREATE_MCP_TOOL_GROUP(""))) {
        const groupType = pathname.split("/").slice(-1)[0] as McpToolGroup.TGroupType;
        modalContent = <McpToolGroupCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} groupType={groupType} />;
    }

    return modalContent;
});

export default ModalPage;
