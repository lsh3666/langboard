import BotRunner from "@/core/ai/BotRunner";
import EventManager, { TEventContext } from "@/core/server/EventManager";
import { Utils } from "@langboard/core/utils";
import { ESocketStatus, ESocketTopic, NONE_TOPIC_ID } from "@langboard/core/enums";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import ProjectAssignedInternalBot, { IProjectAssignedInternalBotSettings } from "@/models/ProjectAssignedInternalBot";

interface IEditorEventRegistryParams {
    eventPrefix: string;
    chatType: EInternalBotType;
    copilotType: EInternalBotType;
    getInternalBot: (botType: EInternalBotType, context: TEventContext) => Promise<[InternalBot, IProjectAssignedInternalBotSettings] | [null, null]>;
    createRestData?: (context: TEventContext) => Record<string, unknown>;
}

const registerEditorEvents = ({ eventPrefix, chatType, copilotType, getInternalBot, createRestData }: IEditorEventRegistryParams) => {
    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:chat:send`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !Utils.Type.isString(task_id)) {
            return;
        }

        const [internalBot, internalBotSettings] = await getInternalBot(chatType, context);
        if (!internalBot) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "No chat bot available for this project", false);
            return;
        }

        const response = await BotRunner.runAbortable({
            internalBot,
            internalBotSettings,
            taskID: task_id,
            data: {
                ...context.data,
                rest_data: createRestData ? createRestData(context) : undefined,
                user_id: context.client.user.id,
            },
        });

        const stream = context.client.stream(ESocketTopic.None, NONE_TOPIC_ID, `${eventPrefix}:editor:chat:stream`);
        stream.start();
        let message = "";
        if (!response) {
            stream.end({ message: "" });
            return;
        }

        if (Utils.Type.isString(response)) {
            stream.buffer({ message: response });
            message = response;
            stream.end({ message });
            return;
        }

        const isAborted = BotRunner.createAbortedChecker(chatType, task_id);
        if (isAborted()) {
            return;
        }

        let newContent = "";
        let lastContent: string | undefined = undefined;

        await response
            .onMessage((chunk) => {
                const oldContent = newContent;
                let updatedContent = "";
                if (chunk) {
                    if (oldContent) {
                        newContent = chunk.startsWith(oldContent) ? chunk : `${oldContent}${chunk}`;
                        updatedContent = chunk.split(oldContent, 2).pop() || chunk;
                    } else {
                        newContent = chunk;
                        updatedContent = chunk;
                    }
                }

                if (lastContent !== newContent) {
                    stream.buffer({ message: updatedContent });
                    lastContent = newContent;
                }
            })
            .onError((error) => {
                stream.end({ status: "failed", message: error.message });
            })
            .onEnd(() => {
                stream.end({ message });
            })
            .stream();
    });

    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:chat:abort`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !Utils.Type.isString(task_id)) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
            return;
        }

        await BotRunner.abort({ botType: chatType, taskID: task_id, client: context.client });
    });

    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:copilot:send`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !Utils.Type.isString(task_id)) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
            return;
        }

        const [internalBot, internalBotSettings] = await getInternalBot(copilotType, context);
        if (!internalBot) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "No chat bot available for this project", false);
            return;
        }

        const response = await BotRunner.runAbortable({
            internalBot,
            internalBotSettings,
            taskID: task_id,
            data: {
                ...context.data,
                rest_data: createRestData ? createRestData(context) : undefined,
            },
        });

        const sharedData = {
            topic: ESocketTopic.None,
            topic_id: NONE_TOPIC_ID,
            event: `${eventPrefix}:editor:copilot:receive:${task_id}`,
        };

        if (!response) {
            context.client.send({
                ...sharedData,
                data: { text: "0" },
            });
            return;
        }

        if (Utils.Type.isString(response)) {
            context.client.send({
                ...sharedData,
                data: { text: response },
            });
            return;
        }

        const isAborted = BotRunner.createAbortedChecker(copilotType, task_id);
        if (isAborted()) {
            return;
        }

        let message = "";
        await response
            .onMessage((data) => {
                message = `${message}${data}`;
            })
            .onError(() => {
                context.client.send({
                    ...sharedData,
                    data: { text: "0" },
                });
            })
            .onEnd(() => {
                context.client.send({
                    ...sharedData,
                    data: { text: message },
                });
            })
            .stream();
    });

    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:copilot:abort`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !Utils.Type.isString(task_id)) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
            return;
        }

        await BotRunner.abort({ botType: chatType, taskID: task_id, client: context.client });
    });
};

interface IEditorType {
    type: string;
    getInternalBot: IEditorEventRegistryParams["getInternalBot"];
    createRestData?: IEditorEventRegistryParams["createRestData"];
}

const EDITOR_TYPES: IEditorType[] = [
    {
        type: "board:card",
        getInternalBot: async (botType, context) =>
            !Utils.Type.isString(context.data.project_uid)
                ? [null, null]
                : ((await ProjectAssignedInternalBot.getInternalBotByProjectUID(botType, context.data.project_uid)) ?? [null, null]),
        createRestData: (context) => ({
            project_uid: context.data.project_uid,
            cuurrent_card_uid: context.data.card_uid,
        }),
    },
    {
        type: "board:wiki",
        getInternalBot: async (botType, context) =>
            !Utils.Type.isString(context.data.project_uid)
                ? [null, null]
                : ((await ProjectAssignedInternalBot.getInternalBotByProjectUID(botType, context.data.project_uid)) ?? [null, null]),
        createRestData: (context) => ({
            project_uid: context.data.project_uid,
            cuurrent_wiki_uid: context.data.wiki_uid,
        }),
    },
];

for (let i = 0; i < EDITOR_TYPES.length; ++i) {
    const { type, ...params } = EDITOR_TYPES[i];
    registerEditorEvents({
        eventPrefix: type,
        chatType: EInternalBotType.EditorChat,
        copilotType: EInternalBotType.EditorCopilot,
        ...params,
    });
}
