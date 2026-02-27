/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ApiKeySettingModel } from "@/core/models";

export interface ICreateApiKeyForm {
    name: string;
    ip_whitelist: string | null;
    is_active: bool;
    expires_in_days: string | null;
}

export interface ICreateApiKeyResponse {
    api_key: ApiKeySettingModel.Interface;
    key: string;
}

const useCreateApiKey = (options?: TMutationOptions<ICreateApiKeyForm, ICreateApiKeyResponse>) => {
    const { mutate } = useQueryMutation();

    const createApiKey = async (params: ICreateApiKeyForm) => {
        const res = await api.post(Routing.API.SETTINGS.API_KEYS.CREATE, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });
        ApiKeySettingModel.Model.fromOne(res.data.api_key, true);

        return res.data;
    };

    const result = mutate(["create-api-key"], createApiKey, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateApiKey;
