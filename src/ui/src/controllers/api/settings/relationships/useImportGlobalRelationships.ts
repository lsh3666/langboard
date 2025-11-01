/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType } from "@/core/models";

export interface IImportGlobalRelationshipsForm {
    relationships: {
        parent_name: string;
        child_name: string;
        description?: string;
    }[];
}

const useImportGlobalRelationships = (options?: TMutationOptions<IImportGlobalRelationshipsForm>) => {
    const { mutate } = useQueryMutation();

    const importGlobalRelationships = async (params: IImportGlobalRelationshipsForm) => {
        const res = await api.post(
            Routing.API.SETTINGS.GLOBAL_RELATIONSHIPS.IMPORT,
            {
                ...params,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        GlobalRelationshipType.Model.fromArray(res.data.global_relationships, true);

        return res.data;
    };

    const result = mutate(["import-global-relationships"], importGlobalRelationships, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useImportGlobalRelationships;
