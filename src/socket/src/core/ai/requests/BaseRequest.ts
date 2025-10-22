/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseStreamResponse from "@/core/ai/requests/responses/BaseStreamResponse";
import { IBotRequestModel } from "@/core/ai/types";
import { EBotPlatform } from "@/models/bot.related.types";
import InternalBot from "@/models/InternalBot";
import { IProjectAssignedInternalBotSettings } from "@/models/ProjectAssignedInternalBot";
import formidable from "formidable";

export interface IRequestExecuteParams {
    requestModel: IBotRequestModel;
    task?: [AbortController, () => void];
    useStream?: bool;
}

export interface IRequestParams {
    requestModel: IRequestData;
    headers: Record<string, any>;
    task?: [AbortController, () => void];
    useStream: bool;
}

export interface IRequestData {
    url: string;
    oneTimeToken: string;
    reqData: Record<string, any>;
}

abstract class BaseRequest {
    constructor(
        protected internalBot: InternalBot,
        protected baseURL: string,
        protected internalBotSettings?: IProjectAssignedInternalBotSettings
    ) {
        this.baseURL = !baseURL.endsWith("/") ? baseURL : baseURL.slice(0, -1);
    }

    public execute({ requestModel, task, useStream = false }: IRequestExecuteParams) {
        const headers = this.getBotRequestHeaders();

        const apiRequestModel = this.createRequestData({
            requestModel,
            useStream,
        });

        return this.request({ requestModel: apiRequestModel, headers, task, useStream });
    }

    protected abstract createRequestData(params: IRequestExecuteParams): IRequestData;
    protected abstract request(params: IRequestParams): Promise<string | BaseStreamResponse | null>;
    public abstract upload(file: formidable.File): Promise<string | null>;
    public abstract isAvailable(): Promise<bool>;

    protected getBotRequestHeaders() {
        const headers: Record<string, any> = {
            "Content-Type": "application/json",
        };

        switch (this.internalBot.platform) {
            case EBotPlatform.Default:
                break;
            case EBotPlatform.Langflow:
                headers["x-api-key"] = this.internalBot.api_key;
                break;
            default:
                throw new Error(`Unsupported platform: ${this.internalBot.platform}`);
        }

        return headers;
    }

    protected getTitlePrompt() {
        return `You are an expert at creating concise and relevant titles based on user input.
Generate a title that accurately reflects the content and purpose of the input provided by the user.
Keep the title brief, engaging, and to the point.
YOU MUST RESPOND WITH ONLY THE TITLE AND NO ADDITIONAL TEXT.`;
    }
}

export default BaseRequest;
