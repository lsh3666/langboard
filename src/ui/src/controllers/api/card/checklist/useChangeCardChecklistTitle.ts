import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeCardChecklistTitleForm {
    project_uid: string;
    card_uid: string;
    checklist_uid: string;
    title: string;
}

const useChangeCardChecklistTitle = (options?: TMutationOptions<IChangeCardChecklistTitleForm>) => {
    const { mutate } = useQueryMutation();

    const changeChecklistTitle = async (params: IChangeCardChecklistTitleForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CHECKLIST.CHANGE_TITLE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checklist_uid: params.checklist_uid,
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

    const result = mutate(["change-card-checklist-title"], changeChecklistTitle, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardChecklistTitle;
