import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType } from "@/core/models";

const useGetGlobalRelationships = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getGlobalRelationships = async () => {
        const res = await api.get(Routing.API.SETTINGS.GLOBAL_RELATIONSHIPS.GET_LIST, {
            env: {
                noToast: options?.interceptToast,
            } as never,
        });

        GlobalRelationshipType.Model.fromArray(res.data.global_relationships, true);

        return {};
    };

    const result = mutate(["get-global-relationships"], getGlobalRelationships, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetGlobalRelationships;
