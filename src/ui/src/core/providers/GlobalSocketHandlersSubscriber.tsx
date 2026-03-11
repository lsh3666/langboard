import useBotCreatedHandlers from "@/controllers/socket/global/useBotCreatedHandlers";
import useGlobalRelationshipCreatedHandlers from "@/controllers/socket/global/useGlobalRelationshipCreatedHandlers";
import useInternalBotCreatedHandlers from "@/controllers/socket/global/useInternalBotCreatedHandlers";
import useInternalBotDeletedHandlers from "@/controllers/socket/global/useInternalBotDeletedHandlers";
import useInternalBotUpdatedHandlers from "@/controllers/socket/global/useInternalBotUpdatedHandlers";
import useSelectedGlobalRelationshipsDeletedHandlers from "@/controllers/socket/global/useSelectedGlobalRelationshipsDeletedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useSocket } from "@/core/providers/SocketProvider";
import { createContext, useMemo } from "react";

interface IGlobalSocketHandlersSubscriberProps {
    children: React.ReactNode;
}

const GlobalSocketHandlersSubscriberContext = createContext({});

export const GlobalSocketHandlersSubscriber = ({ children }: IGlobalSocketHandlersSubscriberProps): React.ReactNode => {
    const socket = useSocket();
    const botCreatedHandlers = useBotCreatedHandlers({});
    const globalRelationshipCreatedHandlers = useGlobalRelationshipCreatedHandlers({});
    const selectedGlobalRelationshipsDeletedHandlers = useSelectedGlobalRelationshipsDeletedHandlers({});
    const internalBotCreatedHandlers = useInternalBotCreatedHandlers({});
    const internalBotUpdatedHandlers = useInternalBotUpdatedHandlers({});
    const internalBotDeletedHandlers = useInternalBotDeletedHandlers({});
    const handlers = useMemo(
        () => [
            botCreatedHandlers,
            globalRelationshipCreatedHandlers,
            selectedGlobalRelationshipsDeletedHandlers,
            internalBotCreatedHandlers,
            internalBotUpdatedHandlers,
            internalBotDeletedHandlers,
        ],
        [
            botCreatedHandlers,
            globalRelationshipCreatedHandlers,
            selectedGlobalRelationshipsDeletedHandlers,
            internalBotCreatedHandlers,
            internalBotUpdatedHandlers,
            internalBotDeletedHandlers,
        ]
    );

    useSwitchSocketHandlers({
        socket,
        handlers,
    });

    return <GlobalSocketHandlersSubscriberContext.Provider value={{}}>{children}</GlobalSocketHandlersSubscriberContext.Provider>;
};
