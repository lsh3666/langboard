/* eslint-disable @typescript-eslint/no-explicit-any */
import { TBotScopeRelatedParams } from "@/controllers/api/shared/botScopes/types";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { EBotTriggerCondition } from "@/core/models/botScopes/EBotTriggerCondition";
import { Utils } from "@langboard/core/utils";

export type TUseToggleBotScopeTriggerConditionParams = TBotScopeRelatedParams & {
    bot_scope_uid: string;
};

export interface IToggleBotScopeTriggerConditionForm {
    condition: EBotTriggerCondition;
}

const useToggleBotScopeTriggerCondition = (
    params: TUseToggleBotScopeTriggerConditionParams,
    options?: TMutationOptions<IToggleBotScopeTriggerConditionForm>
) => {
    const { mutate } = useQueryMutation();

    const toggleBotScopeTriggerCondition = async (form: IToggleBotScopeTriggerConditionForm) => {
        const url = Utils.String.format(Routing.API.BOT.SCOPE.TOGGLE_TRIGGER_CONDITION, {
            bot_uid: params.bot_uid,
            scope_uid: params.bot_scope_uid,
        });
        const res = await api.put(
            url,
            {
                target_table: params.target_table,
                condition: form.condition,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["toggle-bot-scope-trigger-condition"], toggleBotScopeTriggerCondition, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleBotScopeTriggerCondition;
