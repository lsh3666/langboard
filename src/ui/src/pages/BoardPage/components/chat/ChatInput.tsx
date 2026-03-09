import Button from "@/components/base/Button";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Textarea from "@/components/base/Textarea";
import Toast from "@/components/base/Toast";
import useUploadProjectChatAttachment from "@/controllers/api/board/chat/useUploadProjectChatAttachment";
import useBoardChatCancelHandlers from "@/controllers/socket/board/chat/useBoardChatCancelHandlers";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { cn, measureTextAreaHeight } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import ChatTemplateListDialog from "@/pages/BoardPage/components/chat/ChatTemplateListDialog";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MAX_FILE_SIZE_MB } from "@/constants";
import useBoardChatSentHandlers from "@/controllers/socket/board/chat/useBoardChatSentHandlers";
import ChatInputPreviewList from "@/pages/BoardPage/components/chat/ChatInputPreviewList";
import { ChatInputProvider, useChatInput } from "@/pages/BoardPage/components/chat/ChatInputProvider";
import ChatInputFileUpload from "@/pages/BoardPage/components/chat/ChatInputFileUpload";
import ChatInputAddScopeDialog from "@/pages/BoardPage/components/chat/ChatInputAddScopeDialog";

export interface IChatInputProps {
    height: number;
    setHeight: (height: number) => void;
}

function ChatInput({ height, setHeight }: IChatInputProps) {
    return (
        <ChatInputProvider height={height} setHeight={setHeight}>
            <ChatInputDisplay />
        </ChatInputProvider>
    );
}

function ChatInputDisplay() {
    const { projectUID, isSending, setIsSending, isUploading, setIsUploading, currentSessionUID, selectedScope, setSelectedScope, chatTaskIdRef } =
        useBoardChat();
    const { chatAttachmentRef, chatInputRef, height, setFile, setHeight } = useChatInput();
    const [t] = useTranslation();
    const { mutateAsync: uploadProjectChatAttachmentMutateAsync } = useUploadProjectChatAttachment();
    const { send: cancelChat } = useBoardChatCancelHandlers({ projectUID });
    const { send: sendChat } = useBoardChatSentHandlers({ projectUID });
    const abortControllerRef = useRef<AbortController | null>(null);
    const updateHeight = useCallback(() => {
        if (!Utils.Type.isElement(chatInputRef.current, "textarea")) {
            return;
        }

        const selectionStart = chatInputRef.current.selectionStart;
        const selectionEnd = chatInputRef.current.selectionEnd;
        let measuredHeight = measureTextAreaHeight(chatInputRef.current);
        const maxHeight = window.innerHeight * 0.2;
        if (measuredHeight > maxHeight) {
            measuredHeight = maxHeight;
        }
        setHeight(measuredHeight);
        chatInputRef.current.selectionStart = selectionStart;
        chatInputRef.current.selectionEnd = selectionEnd;
    }, [setHeight]);

    const send = useCallback(async () => {
        if (!chatInputRef.current || !chatAttachmentRef.current) {
            return;
        }

        if (isUploading) {
            abortControllerRef.current?.abort();
            return;
        }

        if (!isUploading && isSending) {
            cancelChat({
                project_uid: projectUID,
                task_id: chatTaskIdRef.current,
            });
            return;
        }

        setIsSending(true);

        let filePath: string | undefined = undefined;
        const attachment = chatAttachmentRef.current.files?.[0];
        if (attachment) {
            setIsUploading(true);
            abortControllerRef.current = new AbortController();

            let result;
            try {
                result = await uploadProjectChatAttachmentMutateAsync({
                    project_uid: projectUID,
                    attachment,
                    abortController: abortControllerRef.current,
                });
            } catch {
                Toast.Add.error(
                    t("errors.Failed to upload attachment. File size may be too large (Max size is {size}MB).", { size: MAX_FILE_SIZE_MB })
                );
                setIsUploading(false);
                setIsSending(false);
                return;
            }

            setIsUploading(false);
            filePath = result.file_path;
        }

        const chatMessage = chatInputRef.current.value.trim();

        if (!chatMessage.length && !filePath) {
            setIsSending(false);
            return;
        }

        chatInputRef.current.value = "";
        chatAttachmentRef.current.value = "";
        setSelectedScope(undefined);
        setFile(null);
        updateHeight();

        let tried = 0;
        let triedTimeout: NodeJS.Timeout | undefined;
        const trySendChat = () => {
            if (tried >= 5) {
                Toast.Add.error(t("errors.Server has been temporarily disabled. Please try again later."));
                setIsSending(false);
                return true;
            }

            ++tried;

            chatTaskIdRef.current = Utils.String.Token.uuid();

            const [scopeTable, scopeUID] = selectedScope || [undefined, undefined];

            return sendChat({
                message: chatMessage,
                file_path: filePath,
                task_id: chatTaskIdRef.current,
                session_uid: currentSessionUID,
                scope_table: scopeTable,
                scope_uid: scopeUID,
            }).isConnected;
        };

        const trySendChatWrapper = () => {
            if (triedTimeout) {
                clearTimeout(triedTimeout);
                triedTimeout = undefined;
            }

            const isSent = trySendChat();
            if (!isSent) {
                triedTimeout = setTimeout(trySendChatWrapper, 1000);
            }
        };

        if (!trySendChat()) {
            triedTimeout = setTimeout(trySendChatWrapper, 1000);
        }
    }, [updateHeight, isSending, setIsSending, isUploading, setIsUploading, currentSessionUID, setSelectedScope]);

    const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.shiftKey && e.key === "Enter") {
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            send();
        }
    };

    return (
        <Flex
            direction="col"
            gap="1.5"
            w="full"
            py="1"
            position="relative"
            className="min-h-[calc(theme(spacing.24)_-_1px)] border-t bg-background focus-within:ring-ring"
        >
            <ChatInputPreviewList />
            <Textarea
                placeholder={t("project.Enter a message")}
                className="max-h-[20vh] min-h-12 border-none px-2 shadow-none focus-visible:ring-0"
                resize="none"
                disabled={isSending}
                style={{ height }}
                onKeyDown={handleTextAreaKeyDown}
                onChange={updateHeight}
                ref={chatInputRef}
            />
            <Flex justify="between" items="center">
                <Flex items="center" gap="1">
                    <ChatInputFileUpload />
                    <ChatTemplateListDialog chatInputRef={chatInputRef} updateHeight={updateHeight} />
                    <ChatInputAddScopeDialog />
                </Flex>
                <Button
                    type="button"
                    variant={isSending ? "secondary" : "default"}
                    size={isSending ? "icon-sm" : "sm"}
                    className={"mr-1 gap-1.5 px-2"}
                    title={t(isSending ? "project.Stop" : "project.Send a message")}
                    titleSide="top"
                    onClick={send}
                >
                    <IconComponent
                        icon={isSending ? (isUploading ? "loader-circle" : "square") : "send"}
                        size="3"
                        className={cn(isUploading && "animate-spin")}
                    />
                    {!isSending && t("common.Send")}
                </Button>
            </Flex>
        </Flex>
    );
}

export default ChatInput;
