/* eslint-disable @typescript-eslint/no-explicit-any */
import { TAgentModelName } from "@/ai/constants";
import { TAgentFormInput } from "@/ai/form.types";
import { AMAZON_BEDROCK_MODELS, AMAZON_BEDROCK_REGIONS } from "@/ai/models/Amazon";
import { ANTHROPIC_MODELS } from "@/ai/models/Anthropic";
import { AZURE_OPEN_AI_API_VERSIONS } from "@/ai/models/Azure";
import { GOOGLE_GENERATIVE_AI_MODELS } from "@/ai/models/Google";
import { GROQ_MODELS } from "@/ai/models/Groq";
import { getLMStudioModels } from "@/ai/models/LMStudio";
import { NVIDIA_MODELS } from "@/ai/models/Nvidia";
import { getOllamaModels, OLLAMA_DEFAULT_VALUE } from "@/ai/models/Ollama";
import { OPEN_AI_MODELS } from "@/ai/models/OpenAI";
import { SAMBA_NOVA_MODELS } from "@/ai/models/SambaNova";

export const getAgentModelInputForm = (model: TAgentModelName, envs: Record<string, any> = {}): TAgentFormInput[] => {
    const form: TAgentFormInput[] = [];
    switch (model) {
        case "Azure OpenAI":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                {
                    type: "select",
                    name: "api_version",
                    label: "API Version",
                    options: AZURE_OPEN_AI_API_VERSIONS as unknown as string[],
                },
                { type: "text", name: "azure_endpoint", label: "Endpoint" },
                { type: "text", name: "azure_deployment", label: "Deployment Name" }
            );
            break;
        case "Amazon Bedrock":
            form.push(
                { type: "password", name: "aws_access_key_id", label: "Access Key ID" },
                { type: "password", name: "aws_secret_access_key", label: "Secret Access Key" },
                { type: "password", name: "aws_session_token", label: "Session Token", nullable: true },
                { type: "select", name: "model_id", label: "Provider", options: AMAZON_BEDROCK_MODELS as unknown as string[] },
                { type: "select", name: "region_name", label: "Region", options: AMAZON_BEDROCK_REGIONS as unknown as string[] }
            );
            break;
        case "Anthropic":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Provider", options: ANTHROPIC_MODELS as unknown as string[] }
            );
            break;
        case "Google Generative AI":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Provider", options: GOOGLE_GENERATIVE_AI_MODELS as unknown as string[] }
            );
            break;
        case "Groq":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Provider", options: GROQ_MODELS as unknown as string[] }
            );
            break;
        case "NVIDIA":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Provider", options: NVIDIA_MODELS as unknown as string[] }
            );
            break;
        case "OpenAI":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Provider", options: OPEN_AI_MODELS as unknown as string[] }
            );
            break;
        case "SambaNova":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Provider", options: SAMBA_NOVA_MODELS as unknown as string[] }
            );
            break;
        case "Ollama":
            form.push(
                {
                    type: "text",
                    name: "base_url",
                    label: "Base URL",
                    defaultValue: "",
                    checkDefault: envs.IS_OLLAMA_RUNNING ? OLLAMA_DEFAULT_VALUE : undefined,
                },
                {
                    type: "select",
                    name: "model_name",
                    label: "Provider",
                    options: [],
                    getOptions: getOllamaModels,
                }
            );
            break;
        case "LM Studio":
            form.push(
                { type: "text", name: "base_url", label: "Base URL", defaultValue: "" },
                { type: "text", name: "api_key", label: "API Key", nullable: true },
                {
                    type: "select",
                    name: "model_name",
                    label: "Provider",
                    options: [],
                    getOptions: getLMStudioModels,
                }
            );
            break;
        default:
            return [];
    }
    return form;
};
