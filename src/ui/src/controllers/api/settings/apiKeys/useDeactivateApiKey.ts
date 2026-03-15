import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { ApiKeySettingModel } from "@/core/models";

const useDeactivateApiKey = (apiKey: ApiKeySettingModel.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deactivateApiKey = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.API_KEYS.DEACTIVATE, { key_uid: apiKey.uid });
        const res = await api.put(url, undefined, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        apiKey.activated_at = undefined;

        return res.data;
    };

    const result = mutate(["deactivate-api-key"], deactivateApiKey, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeactivateApiKey;
