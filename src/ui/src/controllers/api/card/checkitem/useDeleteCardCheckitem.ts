import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteCardCheckitemForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
}

const useDeleteCardCheckitem = (options?: TMutationOptions<IDeleteCardCheckitemForm>) => {
    const { mutate } = useQueryMutation();

    const deleteCheckitem = async (params: IDeleteCardCheckitemForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CHECKITEM.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["delete-card-checkitem"], deleteCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCardCheckitem;
