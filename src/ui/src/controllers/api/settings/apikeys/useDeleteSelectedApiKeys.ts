/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ApiKeySettingModel } from "@/core/models";

export interface IDeleteSelectedApiKeysForm {
    key_uids: string[];
}

const useDeleteSelectedApiKeys = (options?: TMutationOptions<IDeleteSelectedApiKeysForm>) => {
    const { mutate } = useQueryMutation();

    const deleteSelectedApiKeys = async (params: IDeleteSelectedApiKeysForm) => {
        const res = await api.delete(Routing.API.SETTINGS.API_KEYS.DELETE_SELECTED, {
            data: params,
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });
        ApiKeySettingModel.Model.deleteModels(params.key_uids);

        return res.data;
    };

    const result = mutate(["delete-selected-api-keys"], deleteSelectedApiKeys, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSelectedApiKeys;
