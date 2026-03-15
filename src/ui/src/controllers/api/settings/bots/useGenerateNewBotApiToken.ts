import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IGenerateNewBotApiTokenResponse {
    secret_app_api_token: string;
    revealed_app_api_token: string;
}

const useGenerateNewBotApiToken = (bot: BotModel.TModel, options?: TMutationOptions<unknown, IGenerateNewBotApiTokenResponse>) => {
    const { mutate } = useQueryMutation();

    const generateNewBotApiToken = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.BOTS.GENERATE_NEW_API_TOKEN, { bot_uid: bot.uid });
        const res = await api.put(url, undefined, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return {
            secret_app_api_token: res.data.secret_app_api_token,
            revealed_app_api_token: res.data.revealed_app_api_token,
        };
    };

    const result = mutate(["generate-new-bot-api-token"], generateNewBotApiToken, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGenerateNewBotApiToken;
