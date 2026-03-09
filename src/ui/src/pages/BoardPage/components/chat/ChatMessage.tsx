import IconComponent from "@/components/base/IconComponent";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/Chat/ChatBubble";
import { ChatMessageModel } from "@/core/models";
import { useBoardChat } from "@/core/providers/BoardChatProvider";

export interface IChatMessageProps {
    chatMessage: ChatMessageModel.TModel;
}

function ChatMessage({ chatMessage }: IChatMessageProps): React.JSX.Element {
    const message = chatMessage.useField("message");
    const isReceived = chatMessage.useField("is_received");
    const isPending = chatMessage.useField("isPending");
    const variant = isReceived ? "received" : "sent";

    return (
        <ChatBubble key={`chat-bubble-${chatMessage.uid}`} variant={variant} message={message}>
            {isReceived && <ChatMessageBotAvatar />}
            {isPending ? <ChatBubbleMessage isLoading /> : <ChatBubbleMessage variant={variant} message={message} />}
        </ChatBubble>
    );
}

function ChatMessageBotAvatar() {
    const { bot } = useBoardChat();
    const displayName = bot.useField("display_name");
    const avatar = bot.useField("avatar");

    return (
        <ChatBubbleAvatar
            fallback={<IconComponent icon="bot" className="size-[60%]" />}
            src={avatar}
            title={displayName}
            titleSide="top"
            titleAlign="start"
        />
    );
}

export default ChatMessage;
