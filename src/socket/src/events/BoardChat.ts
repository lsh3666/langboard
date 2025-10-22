/* eslint-disable @typescript-eslint/no-explicit-any */
import BotRunner from "@/core/ai/BotRunner";
import SnowflakeID from "@/core/db/SnowflakeID";
import EventManager from "@/core/server/EventManager";
import { Utils } from "@langboard/core/utils";
import { ESocketStatus, ESocketTopic } from "@langboard/core/enums";
import ChatHistory from "@/models/ChatHistory";
import { EInternalBotType } from "@/models/InternalBot";
import ProjectAssignedInternalBot from "@/models/ProjectAssignedInternalBot";
import { SocketEvents } from "@langboard/core/constants";
import ChatSession from "@/models/ChatSession";
import { TChatScope } from "@langboard/core/types";

EventManager.on(ESocketTopic.Board, SocketEvents.CLIENT.BOARD.CHAT.IS_AVAILABLE, async ({ client, topicId }) => {
    const [internalBot, _] = (await ProjectAssignedInternalBot.getInternalBotByProjectUID(EInternalBotType.ProjectChat, topicId)) ?? [null, null];
    let isAvailable = false;
    if (internalBot) {
        try {
            isAvailable = await BotRunner.isAvailable({ internalBot });
        } catch {
            isAvailable = false;
        }
    }

    const apiBot = internalBot?.apiResponse ?? null;

    client.send({
        topic: ESocketTopic.Board,
        topic_id: topicId,
        event: SocketEvents.SERVER.BOARD.CHAT.IS_AVAILABLE,
        data: { available: isAvailable, bot: apiBot },
    });
});

EventManager.on(ESocketTopic.Board, SocketEvents.CLIENT.BOARD.CHAT.SEND, async ({ client, topicId, data }) => {
    const { message, file_path, task_id, session_uid, scope_uid } = data ?? {};
    if (!Utils.Type.isString(message) || !Utils.Type.isString(task_id)) {
        client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid message data", false);
        return;
    }

    const internalBotResult = await ProjectAssignedInternalBot.getInternalBotByProjectUID(EInternalBotType.ProjectChat, topicId);
    if (!internalBotResult) {
        client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "No chat bot available for this project", false);
        return;
    }

    const [internalBot, internalBotSettings] = internalBotResult;
    const restData: Record<string, any> = {};

    const scopeTable = data.scope_table as TChatScope | undefined;
    if (scopeTable) {
        restData.chat_scope = scopeTable;
        switch (scopeTable) {
            case "project_column":
                restData.project_column_uid = scope_uid;
                break;
            case "card":
                restData.card_uid = scope_uid;
                break;
            case "project_wiki":
                restData.project_wiki_uid = scope_uid;
                break;
            default:
                restData.chat_scope = "project";
                break;
        }
    }

    const response = await BotRunner.runAbortable({
        internalBot,
        internalBotSettings,
        taskID: task_id,
        data: {
            message,
            file_path,
            project_uid: topicId,
            user_id: client.user.id,
            rest_data: restData,
        },
    });

    if (!response) {
        client.send({
            event: SocketEvents.SERVER.BOARD.CHAT.IS_AVAILABLE,
            topic: ESocketTopic.Board,
            topic_id: topicId,
        });
        return;
    }

    const isAborted = BotRunner.createAbortedChecker(EInternalBotType.ProjectChat, task_id);
    if (isAborted()) {
        return;
    }

    let session: ChatSession | null = null;
    if (!Utils.Type.isString(session_uid) || !session_uid) {
        session = await ChatSession.create({
            filterable_table: "project",
            filterable_id: SnowflakeID.fromShortCode(topicId).toString(),
            user_id: client.user.id,
            title: "Untitled",
            last_messaged_at: new Date(),
        }).save();

        client.send({
            event: SocketEvents.SERVER.BOARD.CHAT.SESSION,
            topic: ESocketTopic.Board,
            topic_id: topicId,
            data: { session: session.apiResponse },
        });

        BotRunner.createTitle({
            internalBot,
            internalBotSettings,
            data: {
                message,
                user_id: client.user.id,
                project_uid: topicId,
            },
        }).then(async (title) => {
            title ||= "Untitled";
            if (!session || session.title === title) {
                return;
            }

            session.title = title;
            await ChatSession.update(session.id, {
                title,
            });

            client.send({
                event: SocketEvents.SERVER.BOARD.CHAT.SESSION,
                topic: ESocketTopic.Board,
                topic_id: topicId,
                data: { session: session.apiResponse },
            });
        });
    } else {
        session = await ChatSession.findByUID(session_uid);
        if (!session) {
            client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid chat session", false);
            return;
        }
    }

    const userMessage = await ChatHistory.create({
        chat_session_id: session.id,
        message: { content: message },
        is_received: false,
    }).save();
    await session.updateLastMessagedAt(userMessage.created_at);

    client.send({
        event: SocketEvents.SERVER.BOARD.CHAT.SENT,
        topic: ESocketTopic.Board,
        topic_id: topicId,
        data: { user_message: userMessage.apiResponse },
    });

    if (isAborted()) {
        return;
    }

    const stream = client.stream(ESocketTopic.Board, topicId, SocketEvents.SERVER.BOARD.CHAT.STREAM);
    const aiMessage = await ChatHistory.create({
        chat_session_id: session.id,
        message: { content: "" },
        is_received: true,
    }).save();
    await session.updateLastMessagedAt(aiMessage.created_at);
    const aiMessageUID = new SnowflakeID(aiMessage.id).toShortCode();

    stream.start({ ai_message: aiMessage.apiResponse });

    if (isAborted()) {
        return;
    }

    if (Utils.Type.isString(response)) {
        aiMessage.message = { content: response };
        stream.buffer({ uid: aiMessageUID, message: aiMessage.message });
        stream.end({ uid: aiMessageUID, status: "success" });
        await aiMessage.save();
        await session.updateLastMessagedAt(aiMessage.created_at);
        return;
    }

    const newContent = { content: "" };
    let isReceived = false;
    let lastContent: string | undefined = undefined;

    const saveMessage = async () => {
        await ChatHistory.update(aiMessage.id, {
            message: newContent,
        });
        await session.updateLastMessagedAt(aiMessage.updated_at);
    };

    await response
        .onMessage(async (chunk) => {
            isReceived = true;
            const oldContent = newContent.content;
            let updatedContent = "";
            if (chunk) {
                if (oldContent) {
                    newContent.content = chunk.startsWith(oldContent) ? chunk : `${oldContent}${chunk}`;
                    updatedContent = chunk.split(oldContent, 2).pop() || chunk;
                } else {
                    newContent.content = chunk;
                    updatedContent = chunk;
                }
            }

            if (lastContent !== newContent.content) {
                stream.buffer({ uid: aiMessageUID, chunk: updatedContent });
                lastContent = newContent.content;
            }
        })
        .onError(async (error) => {
            stream.end({ uid: aiMessageUID, status: "failed", error: error.message });
            await aiMessage.remove();
        })
        .onEnd(async () => {
            if (!isReceived) {
                if (!isAborted()) {
                    stream.end({ uid: aiMessageUID, status: "failed" });
                    await aiMessage.remove();
                }

                return;
            }

            stream.end({ uid: aiMessageUID, status: isAborted() ? "aborted" : "success" });
            await saveMessage();
        })
        .stream();
});

EventManager.on(ESocketTopic.Board, SocketEvents.CLIENT.BOARD.CHAT.CANCEL, async ({ client, data }) => {
    const { task_id } = data ?? {};
    if (!Utils.Type.isString(task_id)) {
        client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
        return;
    }

    await BotRunner.abort({ botType: EInternalBotType.ProjectChat, taskID: task_id, client });
});
