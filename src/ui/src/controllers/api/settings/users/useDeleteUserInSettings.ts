import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useDeleteUserInSettings = (user: User.TModel, options?: TMutationOptions<unknown>) => {
    const { mutate } = useQueryMutation();

    const deleteUserInSettings = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.USERS.DELETE, { user_uid: user.uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate([`delete-user-in-settings-${user.uid}`], deleteUserInSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteUserInSettings;
