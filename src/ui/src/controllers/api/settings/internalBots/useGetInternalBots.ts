import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { InternalBotModel } from "@/core/models";

const useGetInternalBots = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getInternalBots = async () => {
        const res = await api.get(Routing.API.SETTINGS.INTERNAL_BOTS.GET_LIST, {
            env: {
                noToast: options?.interceptToast,
            } as never,
        });

        InternalBotModel.Model.fromArray(res.data.internal_bots, true);

        return {};
    };

    const result = mutate(["get-internal-bots"], getInternalBots, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetInternalBots;
