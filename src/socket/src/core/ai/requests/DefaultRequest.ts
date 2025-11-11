/* eslint-disable @typescript-eslint/no-explicit-any */
import { IRequestData, IRequestExecuteParams } from "@/core/ai/requests/BaseRequest";
import { LangboardCalledVariablesComponent } from "@/core/ai/helpers/TweaksComponent";
import { IBotRequestModel } from "@/core/ai/types";
import { Utils } from "@langboard/core/utils";
import { OLLAMA_API_URL } from "@/Constants";
import LangflowRequest from "@/core/ai/requests/LangflowRequest";
import { EBotPlatformRunningType } from "@langboard/core/ai";

class DefaultRequest extends LangflowRequest {
    protected createRequestData(params: IRequestExecuteParams): IRequestData | null {
        const apiRequestModel = super.createRequestData(params);
        if (!apiRequestModel) {
            return null;
        }

        apiRequestModel.reqData = apiRequestModel.reqData as Record<string, any>;

        apiRequestModel.url = `${this.baseURL}/api/v1/run/${this.internalBot.id}`;

        const queryParams = new URLSearchParams({
            stream: params.useStream ? "true" : "false",
        });

        apiRequestModel.url = `${apiRequestModel.url}?${queryParams.toString()}`;

        apiRequestModel.reqData.tweaks = apiRequestModel.reqData.tweaks ?? {};

        if (this.internalBot.platform_running_type === EBotPlatformRunningType.Default) {
            apiRequestModel.reqData.tweaks = this.#setTweaks(params.requestModel, apiRequestModel.reqData.tweaks);
        }

        return apiRequestModel;
    }

    #setTweaks(requestModel: IBotRequestModel, tweaks: Record<string, any>) {
        try {
            const botValue: Record<string, any> = Utils.Json.Parse(this.internalBot.value ?? "{}");
            if (!botValue.agent_llm) {
                throw new Error("agent_llm is required for Default platform");
            }

            const agentLLM = botValue.agent_llm;
            delete botValue.agent_llm;

            if (["Ollama", "LM Studio"].includes(agentLLM)) {
                tweaks[agentLLM] = botValue;
            } else {
                botValue.agent_llm = agentLLM;
                tweaks.Agent = botValue;
            }

            if (tweaks.base_url) {
                delete tweaks.base_url;
            }

            if (tweaks.Ollama?.base_url === "default") {
                tweaks.Ollama.base_url = OLLAMA_API_URL;
            }

            const possibleAgents = ["", "Agent", "Ollama", "LM Studio"];
            for (let i = 0; i < possibleAgents.length; ++i) {
                const possibleKey = possibleAgents[i];
                const agentData = possibleKey ? (tweaks[possibleKey] ?? {}) : tweaks;

                if (agentData.system_prompt) {
                    let systemPrompt;
                    if (requestModel.isTitle) {
                        systemPrompt = this.getTitlePrompt();
                    } else {
                        if (this.internalBotSettings) {
                            systemPrompt = this.internalBotSettings.prompt;
                        } else {
                            systemPrompt = agentData.system_prompt;
                        }
                    }

                    delete agentData.system_prompt;
                    tweaks.Prompt = {
                        prompt: systemPrompt,
                    };
                }

                if (agentData.api_names) {
                    const apiNames = agentData.api_names;
                    delete agentData.api_names;
                    tweaks[LangboardCalledVariablesComponent.name].api_names = apiNames;
                }
            }
        } catch {
            // Ignore parsing errors
        }

        return tweaks;
    }
}

export default DefaultRequest;
