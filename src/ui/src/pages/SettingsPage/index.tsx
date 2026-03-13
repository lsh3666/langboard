import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetSettingRoles from "@/controllers/api/settings/useGetSettingRoles";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { AppSettingProvider } from "@/core/providers/AppSettingProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSocket } from "@/core/providers/SocketProvider";
import { EHttpStatus, ESettingSocketTopicID, ESocketTopic } from "@langboard/core/enums";
import { IS_OLLAMA_RUNNING } from "@/constants";
import BotsPage from "@/pages/SettingsPage/BotsPage";
import GlobalRelationshipsPage from "@/pages/SettingsPage/GlobalRelationshipsPage";
import InternalBotsPage from "@/pages/SettingsPage/InternalBotsPage";
import WebhooksPage from "@/pages/SettingsPage/WebhooksPage";
import UsersPage from "@/pages/SettingsPage/UsersPage";
import ApiKeysPage from "@/pages/SettingsPage/ApiKeysPage";
import OllamaPage from "@/pages/SettingsPage/OllamaPage";
import McpServerPage from "@/pages/SettingsPage/McpServerPage";
import { AuthUser } from "@/core/models";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { ApiKeyRole, McpRole, SettingRole } from "@/core/models/roles";

function SettingsProxy(): React.JSX.Element {
    const { currentUser } = useAuth();
    const socket = useSocket();
    const navigate = usePageNavigateRef();
    const pathname = location.pathname.split("/").slice(0, 3).join("/");
    const { data, isFetching, error } = useGetSettingRoles();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        if (!data || isFetching) {
            setIsReady(() => false);
            return;
        }

        socket.subscribe(ESocketTopic.AppSettings, Object.values(ESettingSocketTopicID), () => {
            if (currentUser) {
                currentUser.setting_role_actions = data.setting_role_actions ?? [];
                currentUser.api_key_role_actions = data.api_key_role_actions ?? [];
                currentUser.mcp_role_actions = data.mcp_role_actions ?? [];
            }

            setIsReady(() => true);
        });
    }, [isFetching]);

    let skeletonContent;
    switch (pathname) {
        case ROUTES.SETTINGS.API_KEYS:
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.USERS:
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.BOTS:
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.INTERNAL_BOTS:
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS:
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.WEBHOOKS:
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.MCP_TOOL_GROUPS:
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.OLLAMA:
            skeletonContent = <></>;
            break;
    }

    return (
        <>
            {isReady && currentUser ? (
                <SettingsProxyDisplay currentUser={currentUser} />
            ) : (
                <DashboardStyledLayout headerNavs={[]} sidebarNavs={[]}>
                    {skeletonContent}
                </DashboardStyledLayout>
            )}
        </>
    );
}

function SettingsProxyDisplay({ currentUser }: { currentUser: AuthUser.TModel }): React.JSX.Element {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const pathname = location.pathname.split("/").slice(0, 3).join("/");
    const apiKeyRoleActions = currentUser.useField("api_key_role_actions");
    const settingRoleActions = currentUser.useField("setting_role_actions");
    const mcpRoleActions = currentUser.useField("mcp_role_actions");
    const { hasRoleAction: hasApiKeyRoleAction } = useRoleActionFilter(apiKeyRoleActions);
    const { hasRoleAction: hasSettingRoleAction } = useRoleActionFilter(settingRoleActions);
    const { hasRoleAction: hasMcpRoleAction } = useRoleActionFilter(mcpRoleActions);

    const headerNavs: Record<string, IHeaderNavItem> = {};

    const sidebarNavs: Record<string, ISidebarNavItem> = {
        [ROUTES.SETTINGS.API_KEYS]: {
            icon: "key-round",
            name: t("settings.API keys"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.API_KEYS, { smooth: true });
            },
            hidden: !hasApiKeyRoleAction(...Object.values(ApiKeyRole.EAction)),
        },
        [ROUTES.SETTINGS.USERS]: {
            icon: "users",
            name: t("settings.Users"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.USERS, { smooth: true });
            },
            hidden: !hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.User),
        },
        [ROUTES.SETTINGS.BOTS]: {
            icon: "bot",
            name: t("settings.Bots"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.BOTS, { smooth: true });
            },
            hidden: !hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.Bot),
        },
        [ROUTES.SETTINGS.INTERNAL_BOTS]: {
            icon: "bot-message-square",
            name: t("settings.Internal bots"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.INTERNAL_BOTS, { smooth: true });
            },
            hidden: !hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.InternalBot),
        },
        [ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS]: {
            icon: "waypoints",
            name: t("settings.Global relationships"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS, { smooth: true });
            },
            hidden: !hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.GlobalRelationship),
        },
        [ROUTES.SETTINGS.WEBHOOKS]: {
            icon: "webhook",
            name: t("settings.Webhooks"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.WEBHOOKS, { smooth: true });
            },
            hidden: !hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.Webhook),
        },
        [ROUTES.SETTINGS.MCP_TOOL_GROUPS]: {
            icon: "package",
            name: t("mcp.MCP Server"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.MCP_TOOL_GROUPS, { smooth: true });
            },
            hidden: !hasMcpRoleAction(...Object.values(McpRole.EAction)),
        },
    };

    if (IS_OLLAMA_RUNNING) {
        sidebarNavs[ROUTES.SETTINGS.OLLAMA] = {
            icon: "ollama",
            name: t("settings.Ollama"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.OLLAMA, { smooth: true });
            },
            hidden: !hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.Ollama),
        };
    }

    if (sidebarNavs[pathname]) {
        sidebarNavs[pathname].current = true;
    }

    let pageContent;
    switch (pathname) {
        case ROUTES.SETTINGS.API_KEYS:
            pageContent = <ApiKeysPage />;
            break;
        case ROUTES.SETTINGS.USERS:
            pageContent = <UsersPage />;
            break;
        case ROUTES.SETTINGS.BOTS:
            pageContent = <BotsPage />;
            break;
        case ROUTES.SETTINGS.INTERNAL_BOTS:
            pageContent = <InternalBotsPage />;
            break;
        case ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS:
            pageContent = <GlobalRelationshipsPage />;
            break;
        case ROUTES.SETTINGS.WEBHOOKS:
            pageContent = <WebhooksPage />;
            break;
        case ROUTES.SETTINGS.MCP_TOOL_GROUPS:
            pageContent = <McpServerPage />;
            break;
        case ROUTES.SETTINGS.OLLAMA:
            pageContent = <OllamaPage />;
            break;
    }

    useEffect(() => {
        const foundAvailableRoute = Object.entries(sidebarNavs).find(([_, nav]) => !nav.hidden)?.[0];
        switch (pathname) {
            case ROUTES.SETTINGS.API_KEYS:
                if (!hasApiKeyRoleAction(...Object.values(ApiKeyRole.EAction))) {
                    navigate(foundAvailableRoute ?? ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }
                break;
            case ROUTES.SETTINGS.USERS:
                if (!hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.User)) {
                    navigate(foundAvailableRoute ?? ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }
                break;
            case ROUTES.SETTINGS.BOTS:
                if (!hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.Bot)) {
                    navigate(foundAvailableRoute ?? ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }
                break;
            case ROUTES.SETTINGS.INTERNAL_BOTS:
                if (!hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.InternalBot)) {
                    navigate(foundAvailableRoute ?? ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }
                break;
            case ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS:
                if (!hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.GlobalRelationship)) {
                    navigate(foundAvailableRoute ?? ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }
                break;
            case ROUTES.SETTINGS.WEBHOOKS:
                if (!hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.Webhook)) {
                    navigate(foundAvailableRoute ?? ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }
                break;
            case ROUTES.SETTINGS.MCP_TOOL_GROUPS:
                if (!hasMcpRoleAction(...Object.values(McpRole.EAction))) {
                    navigate(foundAvailableRoute ?? ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }
                break;
            case ROUTES.SETTINGS.OLLAMA:
                if (!hasSettingRoleAction(...SettingRole.CATEGORIZED_MAP.Ollama)) {
                    navigate(foundAvailableRoute ?? ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }
                break;
        }
    }, [hasApiKeyRoleAction, hasSettingRoleAction, hasMcpRoleAction]);

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={Object.values(sidebarNavs)}>
            <AppSettingProvider currentUser={currentUser}>{pageContent}</AppSettingProvider>
        </DashboardStyledLayout>
    );
}

export default SettingsProxy;
