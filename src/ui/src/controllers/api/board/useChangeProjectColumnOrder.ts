/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeProjectColumnOrderForm {
    project_uid: string;
    project_column_uid: string;
    order: number;
}

const useChangeProjectColumnOrder = (options?: TMutationOptions<IChangeProjectColumnOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeProjectColumnOrder = async (params: IChangeProjectColumnOrderForm) => {
        const url = Utils.String.format(Routing.API.BOARD.COLUMN.CHANGE_ORDER, {
            uid: params.project_uid,
            project_column_uid: params.project_column_uid,
        });
        const res = await api.put(
            url,
            {
                order: params.order,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["change-project-column-order"], changeProjectColumnOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectColumnOrder;
