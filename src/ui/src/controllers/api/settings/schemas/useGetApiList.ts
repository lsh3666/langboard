import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

const useGetApiList = (options?: TMutationOptions<{}, Record<string, string>>) => {
    const { mutate } = useQueryMutation();

    const getApiList = async () => {
        const res = await api.get(Routing.API.SETTINGS.SCHEMAS.API_LIST, {
            env: {
                noToast: options?.interceptToast,
            } as never,
        });

        return res.data.apis;
    };

    const result = mutate(["get-api-list"], getApiList, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetApiList;
