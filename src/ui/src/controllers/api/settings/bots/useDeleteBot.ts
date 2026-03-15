import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useDeleteBot = (bot: BotModel.TModel, options?: TMutationOptions<unknown>) => {
    const { mutate } = useQueryMutation();

    const deleteBot = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.BOTS.DELETE, { bot_uid: bot.uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        BotModel.Model.deleteModel(bot.uid);

        return res.data;
    };

    const result = mutate(["delete-bot"], deleteBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteBot;
