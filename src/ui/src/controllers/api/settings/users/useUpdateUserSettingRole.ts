import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IUpdateUserSettingRoleForm {
    actions: string[];
}

const useUpdateUserSettingRole = (user: User.TModel, options?: TMutationOptions<IUpdateUserSettingRoleForm>) => {
    const { mutate } = useQueryMutation();

    const updateSettingRole = async (params: IUpdateUserSettingRoleForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.USERS.UPDATE_SETTING_ROLE, { user_uid: user.uid });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["update-user-setting-role"], updateSettingRole, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateUserSettingRole;
