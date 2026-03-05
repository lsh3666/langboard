import { TGetModelOptions } from "@/ai/models/types";
import { Utils } from "@/utils";
import axios from "axios";

export const OLLAMA_DEFAULT_VALUE = "default";

export const getOllamaModels = async ({ values, envs, api: existingApi }: TGetModelOptions) => {
    if (!values.base_url) {
        return [];
    }

    let baseURL = values.base_url.endsWith("/") ? values.base_url.slice(0, -1) : values.base_url;
    let listEndpoint = "/api/tags";
    let detailsEndpoint = "/api/show";
    if (values.base_url === OLLAMA_DEFAULT_VALUE) {
        baseURL = envs.API_URL;
        listEndpoint = "/settings/ollama/models";
        detailsEndpoint = "/settings/ollama/model/details";
    }

    const availableModels: string[] = [];
    const api =
        existingApi ||
        axios.create({
            baseURL,
            withCredentials: true,
        });

    try {
        const response = await api.get(listEndpoint);

        const models: { name: string }[] = response.data?.models;
        if (!Utils.Type.isArray(models)) {
            return availableModels;
        }

        for (let i = 0; i < models.length; ++i) {
            const modelName = models[i].name;

            try {
                const modelResponse = await api.post(detailsEndpoint, {
                    model: modelName,
                });

                const capabilities: string[] = modelResponse.data?.capabilities;
                if (!Utils.Type.isArray(capabilities)) {
                    continue;
                }

                if (capabilities.includes("completion")) {
                    availableModels.push(modelName);
                }
            } catch {
                continue;
            }
        }
    } catch {
        return availableModels;
    }

    return availableModels;
};
