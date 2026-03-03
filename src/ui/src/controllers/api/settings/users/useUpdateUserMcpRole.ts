/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IUpdateUserMcpRoleForm {
    actions: string[];
}

const useUpdateUserMcpRole = (user: User.TModel, options?: TMutationOptions<IUpdateUserMcpRoleForm>) => {
    const { mutate } = useQueryMutation();

    const updateMcpRole = async (params: IUpdateUserMcpRoleForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.USERS.UPDATE_MCP_ROLE, { user_uid: user.uid });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["update-user-mcp-role"], updateMcpRole, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateUserMcpRole;
