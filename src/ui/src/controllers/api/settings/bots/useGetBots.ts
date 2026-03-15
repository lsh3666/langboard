import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";

const useGetBots = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getBots = async () => {
        const res = await api.get(Routing.API.SETTINGS.BOTS.GET_LIST, {
            env: {
                noToast: options?.interceptToast,
            } as never,
        });

        BotModel.Model.fromArray(res.data.bots, true);

        return {};
    };

    const result = mutate(["get-bots"], getBots, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetBots;
