import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IUpdateCardAssignedUsersForm {
    project_uid: string;
    card_uid: string;
    assigned_users: string[];
}

const useUpdateCardAssignedUsers = (options?: TMutationOptions<IUpdateCardAssignedUsersForm>) => {
    const { mutate } = useQueryMutation();

    const updateCardAssignedUsers = async (params: IUpdateCardAssignedUsersForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.UPDATE_ASSIGNED_USERS, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.put(
            url,
            {
                assigned_users: params.assigned_users,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["update-card-assigned-users"], updateCardAssignedUsers, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateCardAssignedUsers;
