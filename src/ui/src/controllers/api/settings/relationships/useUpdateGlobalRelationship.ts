import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IUpdateGlobalRelationshipForm {
    parent_name?: string;
    child_name?: string;
    description?: string;
}

const useUpdateGlobalRelationship = (
    globalRelationship: GlobalRelationshipType.TModel,
    options?: TMutationOptions<IUpdateGlobalRelationshipForm>
) => {
    const { mutate } = useQueryMutation();

    const updateGlobalRelationship = async (params: IUpdateGlobalRelationshipForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.GLOBAL_RELATIONSHIPS.UPDATE, { uid: globalRelationship.uid });
        const res = await api.put(
            url,
            {
                ...params,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["update-global-relationship"], updateGlobalRelationship, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateGlobalRelationship;
