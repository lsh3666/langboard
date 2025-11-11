/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteProjectColumnForm {
    project_uid: string;
    project_column_uid: string;
}

const useDeleteProjectColumn = (options?: TMutationOptions<IDeleteProjectColumnForm>) => {
    const { mutate } = useQueryMutation();

    const deleteProjectColumn = async (params: IDeleteProjectColumnForm) => {
        const url = Utils.String.format(Routing.API.BOARD.COLUMN.DELETE, {
            uid: params.project_uid,
            project_column_uid: params.project_column_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["delete-project-column"], deleteProjectColumn, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteProjectColumn;
