import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteCardChecklistForm {
    project_uid: string;
    card_uid: string;
    checklist_uid: string;
}

const useDeleteCardChecklist = (options?: TMutationOptions<IDeleteCardChecklistForm>) => {
    const { mutate } = useQueryMutation();

    const deleteChecklist = async (params: IDeleteCardChecklistForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CHECKLIST.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checklist_uid: params.checklist_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["delete-card-checklist"], deleteChecklist, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCardChecklist;
