/* eslint-disable @typescript-eslint/no-explicit-any */
import { TBotScopeRelatedParams } from "@/controllers/api/shared/botScopes/types";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export type TUseDeleteBotScopeParams = TBotScopeRelatedParams & {
    bot_scope_uid: string;
};

const useDeleteBotScope = (params: TUseDeleteBotScopeParams, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deleteBotScope = async () => {
        const url = Utils.String.format(Routing.API.BOT.SCOPE.DELETE, {
            bot_uid: params.bot_uid,
            scope_uid: params.bot_scope_uid,
        });
        const res = await api.delete(url, {
            data: {
                target_table: params.target_table,
            },
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["delete-bot-scope"], deleteBotScope, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteBotScope;
