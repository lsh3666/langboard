import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteCardForm {
    project_uid: string;
    card_uid: string;
}

const useDeleteCard = (options?: TMutationOptions<IDeleteCardForm>) => {
    const { mutate } = useQueryMutation();

    const deleteCard = async (params: IDeleteCardForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["delete-card"], deleteCard, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCard;
