import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { InternalBotModel } from "@/core/models";

interface IChangeProjectInternalBotSettingsForm {
    bot_type: InternalBotModel.EInternalBotType;
    use_default_prompt?: bool;
    prompt?: string;
}

interface IChangeProjectInternalBotSettingsResponse {}

const useChangeProjectInternalBotSettings = (
    projectUID: string,
    options?: TMutationOptions<IChangeProjectInternalBotSettingsForm, IChangeProjectInternalBotSettingsResponse>
) => {
    const { mutate } = useQueryMutation();

    const changeProjectInternalBotSettings = async (params: IChangeProjectInternalBotSettingsForm) => {
        const url = Utils.String.format(Routing.API.BOARD.SETTINGS.INTERNAL_BOT.CHANGE_SETTINGS, { uid: projectUID });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["change-project-internal-bot-settings"], changeProjectInternalBotSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectInternalBotSettings;
