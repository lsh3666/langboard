/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBotRequestModel } from "@/core/ai/types";
import { Utils } from "@langboard/core/utils";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import formidable from "formidable";
import { createRequest } from "@/core/ai/requests/utils";
import { IProjectAssignedInternalBotSettings } from "@/models/ProjectAssignedInternalBot";
import BaseStreamResponse from "@/core/ai/requests/responses/BaseStreamResponse";

interface IBaseBotOptions {
    internalBot: InternalBot;
    internalBotSettings?: IProjectAssignedInternalBotSettings;
}

export interface IBotRunOptions extends IBaseBotOptions {
    data: Record<string, any>;
}

export interface IBotRunAbortableOptions extends IBaseBotOptions {
    taskID: string;
    data: Record<string, any>;
}

export interface IBotIsAvailableOptions extends IBaseBotOptions {}

export interface IBotUploadOptions extends IBaseBotOptions {
    file: formidable.File;
}

export interface IBotRequestOptions {
    requestModel: IBotRequestModel;
    useStream?: bool;
}

abstract class BaseBot {
    public static get BOT_TYPE(): EInternalBotType {
        return null!;
    }
    #abortableTasks: Map<string, AbortController>;

    constructor() {
        this.#abortableTasks = new Map();
    }

    public abstract run(options: IBotRunOptions): Promise<string | BaseStreamResponse | null>;
    public abstract runAbortable(options: IBotRunAbortableOptions): Promise<string | BaseStreamResponse | null>;
    public abstract createTitle(options: IBotRunOptions): Promise<string>;
    public abstract isAvailable(options: IBotIsAvailableOptions): Promise<bool>;
    public abstract upload(options: IBotUploadOptions): Promise<string | null>;

    public async abort(taskID: string): Promise<void> {
        const task = this.#abortableTasks.get(taskID);
        if (!task) {
            return;
        }

        task.abort();

        this.#abortableTasks.delete(taskID);
    }

    public isAborted(taskID: string): bool {
        const task = this.#abortableTasks.get(taskID);
        if (!task) {
            return true;
        }

        return task.signal.aborted;
    }

    protected async canRequest({ internalBot, internalBotSettings }: IBaseBotOptions): Promise<bool> {
        const request = createRequest(internalBot, internalBotSettings);
        if (!request) {
            return false;
        }

        return await request.isAvailable();
    }

    protected request<TOptions extends IBaseBotOptions & IBotRequestOptions>({
        internalBot,
        internalBotSettings,
        requestModel,
        useStream = false,
    }: TOptions): Promise<TOptions["useStream"] extends true ? BaseStreamResponse | null : string | null> {
        const request = createRequest(internalBot, internalBotSettings);
        if (!request) {
            return Promise.resolve(null);
        }

        return request.execute({
            requestModel,
            useStream,
        }) as any;
    }

    protected requestAbortable<TOptions extends IBaseBotOptions & IBotRequestOptions & { taskID: string }>({
        internalBot,
        internalBotSettings,
        taskID,
        requestModel,
        useStream = false,
    }: TOptions): Promise<TOptions["useStream"] extends true ? BaseStreamResponse | null : string | null> {
        const request = createRequest(internalBot, internalBotSettings);
        if (!request) {
            return Promise.resolve(null);
        }

        const abortController = new AbortController();
        const onAbort = () => {
            this.#abortableTasks.delete(taskID);
            abortController.signal.removeEventListener("abort", onAbort);
        };
        abortController.signal.addEventListener("abort", onAbort);
        this.#abortableTasks.set(taskID, abortController);

        return request.execute({
            requestModel,
            task: [abortController, onAbort],
            useStream,
        }) as any;
    }

    protected async uploadFile({ internalBot, internalBotSettings, file }: IBaseBotOptions & { file: formidable.File }): Promise<string | null> {
        const request = createRequest(internalBot, internalBotSettings);
        if (!request) {
            return null;
        }

        return await request.upload(file);
    }
}

const BOTS = new Map<EInternalBotType, BaseBot>();
export const registerBot = <TBot extends typeof BaseBot>(bot: TBot) => {
    if (!bot.BOT_TYPE) {
        throw new Error("Bot must have a botType property");
    }

    const botType = Utils.String.convertSafeEnum(EInternalBotType, bot.BOT_TYPE);
    BOTS.set(botType, new (bot as any)());
};

export const getBot = (botType: EInternalBotType): BaseBot | undefined => {
    botType = Utils.String.convertSafeEnum(EInternalBotType, botType);
    return BOTS.get(botType);
};

export default BaseBot;
