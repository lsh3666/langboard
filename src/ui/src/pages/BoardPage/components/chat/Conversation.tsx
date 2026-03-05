import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useGetProjectChatMessages from "@/controllers/api/board/chat/useGetProjectChatMessages";
import { Box, Loading } from "@/components/base";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { ChatMessageList } from "@/components/Chat/ChatMessageList";
import { ChatMessageModel } from "@/core/models";
import ChatMessage from "@/pages/BoardPage/components/chat/ChatMessage";
import { cn } from "@/core/utils/ComponentUtils";

const LOADING_ELEMENT_MIDDLE_Y = 18;

export interface IConversationProps {
    chatInputHeight: number;
}

function Conversation({ chatInputHeight }: IConversationProps): React.JSX.Element {
    const { projectUID, scrollToBottomRef, isAtBottomRef, currentSessionUID } = useBoardChat();
    const [t] = useTranslation();
    const [isLoaded, setIsLoaded] = useState(false);
    const isFetchingRef = useRef(false);
    const [isFetched, setIsFetched] = useState(false);
    const { mutateAsync, isLastPage, setIsLastPage, pageRef, lastCurrentDateRef, lastPagesRef } = useGetProjectChatMessages(projectUID);
    const messages = ChatMessageModel.Model.useModels(
        (model) => !!currentSessionUID && model.chat_session_uid === currentSessionUID,
        [currentSessionUID]
    );
    const conversationRef = useRef<HTMLDivElement>(null);
    const sortedMessages = useMemo(() => messages.sort((a, b) => a.updated_at.getTime() - b.updated_at.getTime()), [messages]);
    const lastChatListHeightRef = useRef(0);

    const nextPage = async () => {
        if (isFetchingRef.current || isLastPage) {
            return;
        }

        isFetchingRef.current = true;
        await new Promise((resolve) => {
            setTimeout(async () => {
                await mutateAsync({ session_uid: currentSessionUID });
                isFetchingRef.current = false;
                resolve(null);
            }, 2500);
        });
    };

    useEffect(() => {
        if (!currentSessionUID) {
            setIsLastPage(true);
            return;
        }

        if (!lastPagesRef.current[currentSessionUID]) {
            lastPagesRef.current[currentSessionUID] = 0;
        }

        pageRef.current = lastPagesRef.current[currentSessionUID];
        if (pageRef.current) {
            return;
        }

        lastCurrentDateRef.current = new Date();
        mutateAsync({
            session_uid: currentSessionUID,
        });

        return () => {
            pageRef.current = 0;
        };
    }, [currentSessionUID]);

    useEffect(() => {
        if (!conversationRef.current) {
            return;
        }

        const onScroll = async () => {
            if (!isLoaded) {
                setIsLoaded(true);
                return;
            }

            if (isLastPage) {
                return;
            }

            if (isFetchingRef.current) {
                lastChatListHeightRef.current = conversationRef.current!.scrollHeight;
                return;
            }

            lastChatListHeightRef.current = conversationRef.current!.scrollHeight;
            if (conversationRef.current!.scrollTop <= LOADING_ELEMENT_MIDDLE_Y) {
                await nextPage();
                setIsFetched(true);
            }
        };

        conversationRef.current.addEventListener("scroll", onScroll);

        return () => {
            conversationRef.current?.removeEventListener("scroll", onScroll);
        };
    }, [isLoaded, isLastPage, currentSessionUID]);

    useEffect(() => {
        if (
            !isFetched ||
            !conversationRef.current ||
            !lastChatListHeightRef.current ||
            conversationRef.current.scrollHeight === lastChatListHeightRef.current
        ) {
            return;
        }

        conversationRef.current.scrollTop = conversationRef.current.scrollHeight - lastChatListHeightRef.current;
        lastChatListHeightRef.current = 0;
        setIsFetched(false);
    }, [isFetched]);

    return (
        <Box
            className={cn(
                "h-[calc(100%_-_theme(spacing.12)_-_var(--chat-input-height))]",
                "max-h-[calc(100%_-_theme(spacing.24))] min-h-[calc(100%_-_theme(spacing.24)_-_20vh)]"
            )}
            style={
                {
                    "--chat-input-height": `${chatInputHeight}px`,
                } as React.CSSProperties
            }
        >
            <ChatMessageList scrollToBottomRef={scrollToBottomRef} isAtBottomRef={isAtBottomRef} ref={conversationRef}>
                {!isLastPage && <Loading size="3" variant="secondary" spacing="1" animate="bounce" my="3" />}
                {sortedMessages.map((chatMessage) => (
                    <ChatMessage key={`chat-bubble-${chatMessage.uid}`} chatMessage={chatMessage} />
                ))}
                {!messages.length && (
                    <h2 className="truncate text-nowrap pb-3 text-center text-sm text-accent-foreground">{t("project.Ask anything to {app} AI!")}</h2>
                )}
            </ChatMessageList>
        </Box>
    );
}

export default Conversation;
