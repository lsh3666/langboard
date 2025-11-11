/* eslint-disable @typescript-eslint/no-explicit-any */
import { createOneTimeToken } from "@/core/ai/BotOneTimeToken";
import BaseRequest, { IRequestData, IRequestExecuteParams, IRequestParams } from "@/core/ai/requests/BaseRequest";
import { LangboardCalledVariablesComponent, LangboardFile } from "@/core/ai/helpers/TweaksComponent";
import SnowflakeID from "@/core/db/SnowflakeID";
import { api } from "@/core/helpers/Api";
import Logger from "@/core/utils/Logger";
import { EHttpStatus } from "@langboard/core/enums";
import { Utils } from "@langboard/core/utils";
import formidable from "formidable";
import fs from "fs";
import { LangflowStreamResponse } from "@/core/ai/responses/LangflowResponse";
import BaseStreamResponse from "@/core/ai/responses/BaseStreamResponse";
import { EBotPlatform, EBotPlatformRunningType } from "@langboard/core/ai";

class LangflowRequest extends BaseRequest {
    protected createRequestData({ requestModel, useStream }: IRequestExecuteParams): IRequestData | null {
        const sessionId = requestModel.sessionId ?? Utils.String.Token.generate(32);
        const oneTimeToken = createOneTimeToken(new SnowflakeID(requestModel.userId));

        const queryParams = new URLSearchParams({
            stream: useStream ? "true" : "false",
        });

        let url = this.baseURL;
        switch (this.internalBot.platform_running_type) {
            case EBotPlatformRunningType.Endpoint:
                url = `${url}/${this.internalBot.value?.startsWith("/") ? this.internalBot.value.slice(1) : this.internalBot.value}`;
                break;
            case EBotPlatformRunningType.FlowJson:
                url = `${url}/api/v1/run/${this.internalBot.id}`;
                break;
        }

        url = `${url}?${queryParams.toString()}`;

        requestModel.tweaks = requestModel.tweaks ?? {};

        if (requestModel.filePath) {
            requestModel.tweaks = {
                ...requestModel.tweaks,
                ...new LangboardFile(requestModel.filePath).toTweaks(),
            };
        }

        const component = new LangboardCalledVariablesComponent(
            "chat",
            oneTimeToken,
            "user",
            { uid: new SnowflakeID(requestModel.userId).toShortCode() },
            requestModel.projectUID,
            [],
            requestModel.restData
        );

        const reqData = {
            input_value: requestModel.message,
            input_type: requestModel.inputType,
            output_type: requestModel.outputType,
            session: sessionId,
            session_id: sessionId,
            run_type: "internal_bot",
            uid: this.internalBot.uid,
            tweaks: {
                ...requestModel.tweaks,
                ...component.toTweaks(),
                ...component.toData(),
            },
        };

        return {
            url,
            oneTimeToken,
            reqData,
        };
    }

    protected createStreamResponse({ requestModel, headers, task }: Omit<IRequestParams, "useStream">): BaseStreamResponse {
        const [abortController, finish] = task ?? [undefined, undefined];

        return new LangflowStreamResponse({
            url: requestModel.url,
            headers: headers,
            body: requestModel.reqData,
            signal: abortController?.signal,
            onEnd: finish,
        });
    }

    protected convertResponse(data: { session_id: string; outputs: Record<string, any>[] }): string {
        try {
            let responseOutputs = data.outputs[0];
            while (!responseOutputs.messages) {
                responseOutputs = responseOutputs.outputs[0];
            }
            return responseOutputs.messages[0].message;
        } catch {
            return "";
        }
    }

    public async upload(file: formidable.File): Promise<string | null> {
        const filename = file.originalFilename || file.newFilename;
        if (!filename || !file.size) {
            return null;
        }

        if (![EBotPlatform.Langflow].includes(this.internalBot.platform)) {
            return null;
        }

        const headers = {
            "Content-Type": "multipart/form-data",
            ...this.getBotRequestHeaders(),
        };

        const url = `${this.baseURL}/api/v2/files`;

        const formData = new FormData();
        const blob = new Blob([fs.readFileSync(file.filepath)], { type: file.mimetype ?? undefined });
        formData.append("file", blob, filename);

        try {
            const response = await api.post(url, formData, {
                headers: {
                    ...headers,
                },
                data: formData,
            });

            if (![EHttpStatus.HTTP_200_OK, EHttpStatus.HTTP_201_CREATED].includes(response.status)) {
                throw new Error("Langflow file upload failed");
            }

            return response.data.path ?? null;
        } catch (error) {
            Logger.error(error);
            return null;
        }
    }

    public async isAvailable(): Promise<bool> {
        try {
            const healthCheck = await api.get(`${this.baseURL}/health`, {
                headers: this.getBotRequestHeaders(),
            });

            return healthCheck.status === EHttpStatus.HTTP_200_OK;
        } catch {
            return false;
        }
    }
}

export default LangflowRequest;
