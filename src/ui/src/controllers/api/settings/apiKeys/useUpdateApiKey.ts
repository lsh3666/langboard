/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { ApiKeySettingModel } from "@/core/models";

export interface IUpdateApiKeyForm {
    name?: string;
    ip_whitelist?: string | null;
}

const useUpdateApiKey = (apiKey: ApiKeySettingModel.TModel, options?: TMutationOptions<IUpdateApiKeyForm>) => {
    const { mutate } = useQueryMutation();

    const updateApiKey = async (params: IUpdateApiKeyForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.API_KEYS.UPDATE, { key_uid: apiKey.uid });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });
        ApiKeySettingModel.Model.fromOne(res.data.api_key, true);

        return res.data;
    };

    const result = mutate(["update-api-key"], updateApiKey, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateApiKey;
