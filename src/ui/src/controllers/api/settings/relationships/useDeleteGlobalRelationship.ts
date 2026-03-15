import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useDeleteGlobalRelationship = (globalRelationship: GlobalRelationshipType.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deleteGlobalRelationship = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.GLOBAL_RELATIONSHIPS.DELETE, { uid: globalRelationship.uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        GlobalRelationshipType.Model.deleteModel(globalRelationship.uid);

        return res.data;
    };

    const result = mutate(["delete-global-relationship"], deleteGlobalRelationship, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteGlobalRelationship;
