import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeCardCheckitemTitleForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    title: string;
}

const useChangeCardCheckitemTitle = (options?: TMutationOptions<IChangeCardCheckitemTitleForm>) => {
    const { mutate } = useQueryMutation();

    const changeCheckitemTitle = async (params: IChangeCardCheckitemTitleForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CHECKITEM.CHANGE_TITLE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.put(
            url,
            {
                title: params.title,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["change-card-checkitem-title"], changeCheckitemTitle, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardCheckitemTitle;
