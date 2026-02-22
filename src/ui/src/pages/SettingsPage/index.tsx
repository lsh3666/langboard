import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetAllSettings from "@/controllers/api/settings/useGetAllSettings";
import useIsSettingsAvailable from "@/controllers/api/settings/useIsSettingsAvailable";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { AppSettingProvider } from "@/core/providers/AppSettingProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSocket } from "@/core/providers/SocketProvider";
import { EHttpStatus, ESocketTopic } from "@langboard/core/enums";
import { IS_OLLAMA_RUNNING } from "@/constants";
import BotsPage from "@/pages/SettingsPage/BotsPage";
import GlobalRelationshipsPage from "@/pages/SettingsPage/GlobalRelationshipsPage";
import InternalBotsPage from "@/pages/SettingsPage/InternalBotsPage";
import WebhooksPage from "@/pages/SettingsPage/WebhooksPage";
import UsersPage from "@/pages/SettingsPage/UsersPage";
import ApiKeysPage from "@/pages/SettingsPage/ApiKeysPage";
import OllamaPage from "@/pages/SettingsPage/OllamaPage";
import McpServerPage from "@/pages/SettingsPage/McpServerPage";

function SettingsProxy(): JSX.Element {
    const [t] = useTranslation();
    const { currentUser } = useAuth();
    const socket = useSocket();
    const navigate = usePageNavigateRef();
    const pathname = location.pathname.split("/").slice(0, 3).join("/");
    const { data, isFetching, error } = useIsSettingsAvailable();
    const { mutate: getAllSettingsMutate } = useGetAllSettings();
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

        getAllSettingsMutate(
            {},
            {
                onSuccess: () => {
                    socket.subscribe(ESocketTopic.AppSettings, ["all"], () => {
                        setIsReady(() => true);
                    });
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    });

                    handle(error);
                },
            }
        );
    }, [isFetching]);

    const headerNavs: Record<string, IHeaderNavItem> = {};

    const sidebarNavs: Record<string, ISidebarNavItem> = {
        [ROUTES.SETTINGS.API_KEYS]: {
            icon: "key-round",
            name: t("settings.API keys"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.API_KEYS, { smooth: true });
            },
        },
        [ROUTES.SETTINGS.USERS]: {
            icon: "users",
            name: t("settings.Users"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.USERS, { smooth: true });
            },
        },
        [ROUTES.SETTINGS.BOTS]: {
            icon: "bot",
            name: t("settings.Bots"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.BOTS, { smooth: true });
            },
        },
        [ROUTES.SETTINGS.INTERNAL_BOTS]: {
            icon: "bot-message-square",
            name: t("settings.Internal bots"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.INTERNAL_BOTS, { smooth: true });
            },
        },
        [ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS]: {
            icon: "waypoints",
            name: t("settings.Global relationships"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS, { smooth: true });
            },
        },
        [ROUTES.SETTINGS.WEBHOOKS]: {
            icon: "webhook",
            name: t("settings.Webhooks"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.WEBHOOKS, { smooth: true });
            },
        },
        [ROUTES.SETTINGS.MCP_TOOL_GROUPS]: {
            icon: "package",
            name: t("mcp.MCP Server"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.MCP_TOOL_GROUPS, { smooth: true });
            },
        },
    };

    if (IS_OLLAMA_RUNNING) {
        sidebarNavs[ROUTES.SETTINGS.OLLAMA] = {
            icon: "ollama",
            name: t("settings.Ollama"),
            onClick: () => {
                navigate(ROUTES.SETTINGS.OLLAMA, { smooth: true });
            },
        };
    }

    if (sidebarNavs[pathname]) {
        sidebarNavs[pathname].current = true;
    }

    let pageContent;
    let skeletonContent;
    switch (pathname) {
        case ROUTES.SETTINGS.API_KEYS:
            pageContent = <ApiKeysPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.USERS:
            pageContent = <UsersPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.BOTS:
            pageContent = <BotsPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.INTERNAL_BOTS:
            pageContent = <InternalBotsPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS:
            pageContent = <GlobalRelationshipsPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.WEBHOOKS:
            pageContent = <WebhooksPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.MCP_TOOL_GROUPS:
            pageContent = <McpServerPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.OLLAMA:
            pageContent = <OllamaPage />;
            skeletonContent = <></>;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={Object.values(sidebarNavs)}>
            {isReady && currentUser ? <AppSettingProvider currentUser={currentUser}>{pageContent}</AppSettingProvider> : skeletonContent}
        </DashboardStyledLayout>
    );
}

export default SettingsProxy;
