import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteProjectLabelForm {
    project_uid: string;
    label_uid: string;
}

export interface IDeleteProjectLabelResponse {}

const useDeleteProjectLabel = (options?: TMutationOptions<IDeleteProjectLabelForm, IDeleteProjectLabelResponse>) => {
    const { mutate } = useQueryMutation();

    const deleteProjectLabel = async (params: IDeleteProjectLabelForm) => {
        const url = Utils.String.format(Routing.API.BOARD.SETTINGS.LABEL.DELETE, {
            uid: params.project_uid,
            label_uid: params.label_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });
        return res.data;
    };

    const result = mutate(["delete-project-label"], deleteProjectLabel, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteProjectLabel;
