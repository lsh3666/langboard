import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { Utils } from "@langboard/core/utils";

export interface ICreateBotDefaultScopeBranchForm {
    bot_uid: string;
    name: string;
}

const useCreateBotDefaultScopeBranch = (options?: TMutationOptions<ICreateBotDefaultScopeBranchForm>) => {
    const { mutate } = useQueryMutation();

    const createBotDefaultScopeBranch = async (form: ICreateBotDefaultScopeBranchForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.BOTS.DEFAULT_SCOPE_BRANCH.CREATE, {
            bot_uid: form.bot_uid,
        });
        const res = await api.post(url, form, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });
        return res.data;
    };

    const result = mutate(["create-bot-default-scope-branch"], createBotDefaultScopeBranch, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateBotDefaultScopeBranch;
