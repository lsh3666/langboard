import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface INotifyCardChecklistForm {
    project_uid: string;
    card_uid: string;
    checklist_uid: string;
    user_uids: string[];
}

const useNotifyCardChecklist = (options?: TMutationOptions<INotifyCardChecklistForm>) => {
    const { mutate } = useQueryMutation();

    const notifyChecklist = async (params: INotifyCardChecklistForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CHECKLIST.NOTIFY, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checklist_uid: params.checklist_uid,
        });
        const res = await api.post(
            url,
            {
                user_uids: params.user_uids,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["notify-card-checklist"], notifyChecklist, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useNotifyCardChecklist;
