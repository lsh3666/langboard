import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeCardAttachmentOrderForm {
    project_uid: string;
    card_uid: string;
    attachment_uid: string;
    order: number;
}

const useChangeCardAttachmentOrder = (options?: TMutationOptions<IChangeCardAttachmentOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeCardAttachmentOrder = async (params: IChangeCardAttachmentOrderForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.ATTACHMENT.CHANGE_ORDER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            attachment_uid: params.attachment_uid,
        });
        const res = await api.put(
            url,
            {
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

    const result = mutate(["change-card-attachment-order"], changeCardAttachmentOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardAttachmentOrder;
