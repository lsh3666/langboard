import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { Utils } from "@langboard/core/utils";

export interface IDeleteBotDefaultScopeBranchForm {
    default_scope_uid: string;
}

const useDeleteBotDefaultScopeBranch = (options?: TMutationOptions<IDeleteBotDefaultScopeBranchForm, void>) => {
    const { mutate } = useQueryMutation();

    const deleteBotDefaultScopeBranch = async (form: IDeleteBotDefaultScopeBranchForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.BOTS.DEFAULT_SCOPE_BRANCH.DELETE, {
            default_scope_uid: form.default_scope_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });
        return res.data;
    };

    const result = mutate(["delete-bot-default-scope-branch"], deleteBotDefaultScopeBranch, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteBotDefaultScopeBranch;
