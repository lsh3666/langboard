/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { ApiKeySettingModel } from "@/core/models";

const useDeleteApiKey = (apiKey: ApiKeySettingModel.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deleteApiKey = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.API_KEYS.DELETE, { key_uid: apiKey.uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });
        ApiKeySettingModel.Model.deleteModel(apiKey.uid);

        return res.data;
    };

    const result = mutate(["delete-api-key"], deleteApiKey, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteApiKey;
