/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeProjectColumnNameForm {
    project_uid: string;
    project_column_uid: string;
    name: string;
}

const useChangeProjectColumnName = (options?: TMutationOptions<IChangeProjectColumnNameForm>) => {
    const { mutate } = useQueryMutation();

    const changeProjectColumnName = async (params: IChangeProjectColumnNameForm) => {
        const url = Utils.String.format(Routing.API.BOARD.COLUMN.CHANGE_NAME, {
            uid: params.project_uid,
            project_column_uid: params.project_column_uid,
        });
        const res = await api.put(
            url,
            {
                name: params.name,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["change-project-column-name"], changeProjectColumnName, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectColumnName;
