/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface ICreateCardForm {
    project_uid: string;
    project_column_uid: string;
    title: string;
    assign_users?: string[];
}

const useCreateCard = (options?: TMutationOptions<ICreateCardForm, { uid: string }>) => {
    const { mutate } = useQueryMutation();

    const createCard = async (params: ICreateCardForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CREATE, {
            uid: params.project_uid,
        });
        const res = await api.post(
            url,
            {
                project_column_uid: params.project_column_uid,
                title: params.title,
                assign_users: params.assign_users,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return {
            uid: res.data.card.uid,
        };
    };

    const result = mutate(["create-card"], createCard, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateCard;
