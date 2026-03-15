import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IUpdateUserApiKeyRoleForm {
    actions: string[];
}

const useUpdateUserApiKeyRole = (user: User.TModel, options?: TMutationOptions<IUpdateUserApiKeyRoleForm>) => {
    const { mutate } = useQueryMutation();

    const updateApiKeyRole = async (params: IUpdateUserApiKeyRoleForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.USERS.UPDATE_API_KEY_ROLE, { user_uid: user.uid });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["update-user-api-key-role"], updateApiKeyRole, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateUserApiKeyRole;
