import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { Utils } from "@langboard/core/utils";

export interface IUpdateBotDefaultScopeBranchForm {
    name?: string;
    conditions_map?: Record<string, string[]>;
}

const useUpdateBotDefaultScopeBranch = (default_scope_uid: string, options?: TMutationOptions<IUpdateBotDefaultScopeBranchForm>) => {
    const { mutate } = useQueryMutation();

    const updateBotDefaultScopeBranch = async (form: IUpdateBotDefaultScopeBranchForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.BOTS.DEFAULT_SCOPE_BRANCH.UPDATE, {
            default_scope_uid,
        });
        const res = await api.put(url, form, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });
        return res.data;
    };

    const result = mutate(["update-bot-default-scope-branch", default_scope_uid], updateBotDefaultScopeBranch, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateBotDefaultScopeBranch;
