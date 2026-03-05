/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { useChat as useBaseChat, UseChatHelpers } from "@ai-sdk/react";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";

export const EDITOR_CHAT_KEY = "chat";

export interface IUseChat {
    socket: ISocketContext;
    eventKey: string;
    events: {
        abort: string;
        send: string;
        stream: string;
    };
    commonEventData?: Record<string, any>;
}

export type TAIChatOption = UseChatHelpers<UIMessage> & {
    abort?: () => void;
};

type TUseBaseChat = ReturnType<typeof useBaseChat>;

interface IUseEditorChat extends TUseBaseChat {
    abort: () => void;
}

interface ISocketStreamBufferPayload {
    message?: string;
}

interface ISocketStreamEndPayload extends ISocketStreamBufferPayload {
    status?: string;
}

interface ICreateSocketMessageStreamProps extends Pick<IUseChat, "socket" | "eventKey" | "events"> {
    taskID: string;
    payload: Record<string, unknown>;
    signal?: AbortSignal;
}

interface ILegacyMessage {
    role: UIMessage["role"];
    content: string;
}

const getMessageContent = (message: UIMessage): string => {
    const text = message.parts.reduce((currentText, part) => (part.type === "text" ? `${currentText}${part.text}` : currentText), "");
    if (text.length > 0) {
        return text;
    }

    const fallbackContent = (message as unknown as Record<string, unknown>).content;
    return Utils.Type.isString(fallbackContent) ? fallbackContent : "";
};

const toLegacyMessages = (messages: UIMessage[]): ILegacyMessage[] => {
    return messages.map((message) => ({
        role: message.role,
        content: getMessageContent(message),
    }));
};

const toSafeMessage = (value: unknown): string => (Utils.Type.isString(value) ? value : "");

const createSocketMessageStream = ({
    socket,
    eventKey,
    events,
    taskID,
    payload,
    signal,
}: ICreateSocketMessageStreamProps): ReadableStream<UIMessageChunk> => {
    return new ReadableStream<UIMessageChunk>({
        start(controller) {
            const textPartID = `${taskID}:text`;
            const chatEventKey = `plate-chat-${eventKey}:${taskID}`;

            let hasTextStarted = false;
            let isClosed = false;

            const callbacks = {
                start: () => {},
                buffer: (data: ISocketStreamBufferPayload) => {
                    if (isClosed) {
                        return;
                    }

                    const delta = toSafeMessage(data?.message);
                    if (!delta.length) {
                        return;
                    }

                    if (!hasTextStarted) {
                        controller.enqueue({
                            type: "text-start",
                            id: textPartID,
                        });
                        hasTextStarted = true;
                    }

                    controller.enqueue({
                        type: "text-delta",
                        id: textPartID,
                        delta,
                    });
                },
                end: (data: ISocketStreamEndPayload) => {
                    if (isClosed) {
                        return;
                    }

                    if (data?.status === "failed") {
                        emitError(toSafeMessage(data?.message) || "Failed to generate response");
                        return;
                    }

                    const finalMessage = toSafeMessage(data?.message);
                    if (!hasTextStarted && finalMessage.length) {
                        controller.enqueue({
                            type: "text-start",
                            id: textPartID,
                        });
                        controller.enqueue({
                            type: "text-delta",
                            id: textPartID,
                            delta: finalMessage,
                        });
                        hasTextStarted = true;
                    }

                    if (hasTextStarted) {
                        controller.enqueue({
                            type: "text-end",
                            id: textPartID,
                        });
                    }

                    controller.enqueue({
                        type: "finish",
                        finishReason: "stop",
                    });
                    closeStream();
                },
                error: () => {
                    if (isClosed) {
                        return;
                    }

                    emitError("Socket stream connection failed");
                },
            };

            const off = () => {
                socket.streamOff({
                    topic: ESocketTopic.None,
                    event: events.stream,
                    eventKey: chatEventKey,
                    callbacks,
                });
            };

            const abortHandler = () => {
                if (isClosed) {
                    return;
                }

                socket.send({
                    topic: ESocketTopic.None,
                    eventName: events.abort,
                    data: { task_id: taskID },
                });
                closeStream();
            };

            const cleanup = () => {
                off();
                signal?.removeEventListener("abort", abortHandler);
            };

            const closeStream = () => {
                if (isClosed) {
                    return;
                }

                isClosed = true;
                cleanup();
                controller.close();
            };

            const emitError = (message: string) => {
                if (isClosed) {
                    return;
                }

                if (hasTextStarted) {
                    controller.enqueue({
                        type: "text-end",
                        id: textPartID,
                    });
                }

                controller.enqueue({
                    type: "error",
                    errorText: message,
                });
                controller.enqueue({
                    type: "finish",
                    finishReason: "error",
                });
                closeStream();
            };

            signal?.addEventListener("abort", abortHandler);

            socket.stream({
                topic: ESocketTopic.None,
                event: events.stream,
                eventKey: chatEventKey,
                callbacks,
            });

            const sendResult = socket.send({
                topic: ESocketTopic.None,
                eventName: events.send,
                data: {
                    ...payload,
                    task_id: taskID,
                },
            });

            if (!sendResult.isConnected) {
                emitError("Socket is not connected");
            }
        },
    });
};

export const useChat = (props: IUseChat): IUseEditorChat => {
    const { socket, eventKey, events, commonEventData } = props;

    const configRef = React.useRef({
        socket,
        eventKey,
        events,
        commonEventData,
    });
    configRef.current = {
        socket,
        eventKey,
        events,
        commonEventData,
    };

    const transport = React.useMemo<ChatTransport<UIMessage>>(
        () => ({
            sendMessages: async ({ chatId, messages, abortSignal, body }) => {
                const currentConfig = configRef.current;
                const taskID = Utils.String.Token.generate(8);

                const payload: Record<string, unknown> = {
                    ...(body ?? {}),
                    ...(currentConfig.commonEventData ?? {}),
                    id: chatId,
                    messages: toLegacyMessages(messages),
                };

                return createSocketMessageStream({
                    socket: currentConfig.socket,
                    eventKey: currentConfig.eventKey,
                    events: currentConfig.events,
                    taskID,
                    payload,
                    signal: abortSignal,
                });
            },
            reconnectToStream: async () => null,
        }),
        []
    );

    const chat = useBaseChat({
        id: `editor:${eventKey}`,
        transport,
    });

    const abort = React.useCallback(() => {
        void chat.stop();
    }, [chat]);

    return {
        ...chat,
        abort,
    };
};
