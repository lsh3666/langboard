import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { UserGroup } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IChangeUserGroupNameForm {
    name: string;
}

const useChangeUserGroupName = (group: UserGroup.TModel, options?: TMutationOptions<IChangeUserGroupNameForm>) => {
    const { mutate } = useQueryMutation();

    const changeUserGroupName = async (params: IChangeUserGroupNameForm) => {
        const url = Utils.String.format(Routing.API.ACCOUNT.USER_GROUP.CHANGE_NAME, {
            group_uid: group.uid,
        });
        const res = await api.put(
            url,
            {
                name: params.name,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        group.name = params.name;

        return res.data;
    };

    const result = mutate(["change-user-group-name"], changeUserGroupName, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeUserGroupName;
