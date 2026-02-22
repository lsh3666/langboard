/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { getOllamaModelStore } from "@/core/stores/OllamaModelStore";

const useGetOllamaRunningModelList = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getOllamaRunningModelList = async () => {
        const res = await api.get(Routing.API.SETTINGS.OLLAMA.GET_RUNNING_LIST, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        for (let i = 0; i < res.data.models.length; ++i) {
            res.data.models[i].expires_at = new Date(res.data.models[i].expires_at);
            getOllamaModelStore().upsertModel({
                ...res.data.models[i],
                is_running: true,
            });
        }

        return res.data;
    };

    const result = mutate(["get-ollama-model-running-list"], getOllamaRunningModelList, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetOllamaRunningModelList;
