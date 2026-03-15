import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteCardAttachmentForm {
    project_uid: string;
    card_uid: string;
    attachment_uid: string;
}

const useDeleteCardAttachment = (options?: TMutationOptions<IDeleteCardAttachmentForm>) => {
    const { mutate } = useQueryMutation();

    const deleteCardAttachment = async (params: IDeleteCardAttachmentForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.ATTACHMENT.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            attachment_uid: params.attachment_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });
        return res.data;
    };

    const result = mutate(["delete-card-attachment"], deleteCardAttachment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCardAttachment;
