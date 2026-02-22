/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { getOllamaModelStore } from "@/core/stores/OllamaModelStore";

export interface IGetOllamaModelDetailsParams {
    model: string;
}

const useGetOllamaModelDetails = (options?: TMutationOptions<IGetOllamaModelDetailsParams>) => {
    const { mutate } = useQueryMutation();

    const getOllamaModelDetails = async (params: IGetOllamaModelDetailsParams) => {
        const res = await api.post(
            Routing.API.SETTINGS.OLLAMA.GET_DETAILS,
            { model: params.model },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        getOllamaModelStore().upsertModel({
            name: params.model,
            ...res.data,
        });

        return res.data;
    };

    const result = mutate(["get-ollama-model-details"], getOllamaModelDetails, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetOllamaModelDetails;
