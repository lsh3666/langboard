import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface ICreateCardChecklistForm {
    project_uid: string;
    card_uid: string;
    title: string;
}

const useCreateCardChecklist = (options?: TMutationOptions<ICreateCardChecklistForm>) => {
    const { mutate } = useQueryMutation();

    const createChecklist = async (params: ICreateCardChecklistForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.CHECKLIST.CREATE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.post(
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

    const result = mutate(["create-card-checklist"], createChecklist, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateCardChecklist;
