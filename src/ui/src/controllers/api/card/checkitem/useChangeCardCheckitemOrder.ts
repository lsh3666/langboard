import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeCardCheckitemOrderForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    order: number;
    parent_uid?: string;
}

const useChangeCardCheckitemOrder = (options?: TMutationOptions<IChangeCardCheckitemOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeCheckitemOrder = async (params: IChangeCardCheckitemOrderForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CHECKITEM.CHANGE_ORDER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.put(
            url,
            {
                parent_uid: params.parent_uid,
                order: params.order,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["change-card-checkitem-order"], changeCheckitemOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardCheckitemOrder;
