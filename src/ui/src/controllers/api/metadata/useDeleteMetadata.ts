import { TMetadataForm } from "@/controllers/api/metadata/types";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteMetadataForm {
    keys: string[];
}

const useDeleteMetadata = (form: TMetadataForm, options?: TMutationOptions<IDeleteMetadataForm>) => {
    const { mutate } = useQueryMutation();

    let url: string;
    switch (form.type) {
        case "card":
            url = Utils.String.format(Routing.API.METADATA.CARD, { uid: form.project_uid, card_uid: form.uid });
            break;
        case "project_wiki":
            url = Utils.String.format(Routing.API.METADATA.PROJECT_WIKI, { uid: form.project_uid, wiki_uid: form.uid });
            break;
        default:
            throw new Error("Invalid metadata type");
    }

    const deleteMetadata = async (params: IDeleteMetadataForm) => {
        const res = await api.delete(url, {
            data: params,
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["delete-metadata"], deleteMetadata, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteMetadata;
