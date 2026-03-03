import useBotSettingCreatedHandlers from "@/controllers/socket/settings/bots/useBotSettingCreatedHandlers";
import useMcpToolGroupCreatedHandlers from "@/controllers/socket/settings/mcpToolGroups/useMcpToolGroupCreatedHandlers";
import useSelectedMcpToolGroupsDeletedHandlers from "@/controllers/socket/settings/mcpToolGroups/useSelectedMcpToolGroupsDeletedHandlers";
import useWebhookCreatedHandlers from "@/controllers/socket/settings/webhooks/useWebhookCreatedHandlers";
import useSelectedUsersDeletedHandlers from "@/controllers/socket/settings/users/useSelectedUsersDeletedHandlers";
import useSelectedWebhooksDeletedHandlers from "@/controllers/socket/settings/webhooks/useSelectedWebhooksDeletedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { AuthUser } from "@/core/models";
import { useAuth } from "@/core/providers/AuthProvider";
import { useSocket } from "@/core/providers/SocketProvider";
import { createContext, useContext, useState } from "react";

export interface IAppSettingContext {
    currentUser: AuthUser.TModel;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

interface IAppSettingProviderProps {
    currentUser: AuthUser.TModel;
    children: React.ReactNode;
}

const initialContext = {
    currentUser: {} as AuthUser.TModel,
    isValidating: false,
    setIsValidating: () => {},
};

const AppSettingContext = createContext<IAppSettingContext>(initialContext);

export const AppSettingProvider = ({ currentUser, children }: IAppSettingProviderProps): React.ReactNode => {
    const { signOut } = useAuth();
    const socket = useSocket();
    const [isValidating, setIsValidating] = useState(false);
    const webhookCreatedHandlers = useWebhookCreatedHandlers({});
    const selectedWebhooksDeletedHandlers = useSelectedWebhooksDeletedHandlers({});
    const botSettingCreatedHandlers = useBotSettingCreatedHandlers({});
    const selectedUsersDeletedHandlers = useSelectedUsersDeletedHandlers({
        currentUser,
        signOut,
    });
    const mcpToolGroupCreatedHandlers = useMcpToolGroupCreatedHandlers({});
    const selectedMcpToolGroupsDeletedHandlers = useSelectedMcpToolGroupsDeletedHandlers({});

    useSwitchSocketHandlers({
        socket,
        handlers: [
            webhookCreatedHandlers,
            selectedWebhooksDeletedHandlers,
            botSettingCreatedHandlers,
            selectedUsersDeletedHandlers,
            mcpToolGroupCreatedHandlers,
            selectedMcpToolGroupsDeletedHandlers,
        ],
    });

    return (
        <AppSettingContext.Provider
            value={{
                currentUser,
                isValidating,
                setIsValidating,
            }}
        >
            {children}
        </AppSettingContext.Provider>
    );
};

export const useAppSetting = () => {
    const context = useContext(AppSettingContext);
    if (!context) {
        throw new Error("useAppSetting must be used within an AppSettingProvider");
    }
    return context;
};
