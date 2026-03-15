import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IDeleteSelectedUsersInSettingsForm {
    user_uids: string[];
}

const useDeleteSelectedUsersInSettings = (options?: TMutationOptions<IDeleteSelectedUsersInSettingsForm>) => {
    const { mutate } = useQueryMutation();

    const deleteSelectedUsersInSettings = async (params: IDeleteSelectedUsersInSettingsForm) => {
        const res = await api.delete(Routing.API.SETTINGS.USERS.DELETE_SELECTED, {
            data: params,
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["delete-selected-users-in-settings"], deleteSelectedUsersInSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSelectedUsersInSettings;
