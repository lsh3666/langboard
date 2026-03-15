import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeCardAttachmentNameForm {
    project_uid: string;
    card_uid: string;
    attachment_uid: string;
    attachment_name: string;
}

const useChangeCardAttachmentName = (options?: TMutationOptions<IChangeCardAttachmentNameForm>) => {
    const { mutate } = useQueryMutation();

    const changeCardAttachmentName = async (params: IChangeCardAttachmentNameForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.ATTACHMENT.CHANGE_NAME, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            attachment_uid: params.attachment_uid,
        });
        const res = await api.put(
            url,
            {
                attachment_name: params.attachment_name,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["change-card-attachment-name"], changeCardAttachmentName, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardAttachmentName;
