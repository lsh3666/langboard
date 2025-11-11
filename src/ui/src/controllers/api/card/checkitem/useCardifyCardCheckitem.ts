/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface ICardifyCardCheckitemForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    project_column_uid?: string;
}

const useCardifyCardCheckitem = (options?: TMutationOptions<ICardifyCardCheckitemForm>) => {
    const { mutate } = useQueryMutation();

    const cardifyCheckitem = async (params: ICardifyCardCheckitemForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CHECKITEM.CARDIFY, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.post(
            url,
            {
                project_column_uid: params.project_column_uid,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["cardify-card-checkitem"], cardifyCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCardifyCardCheckitem;
