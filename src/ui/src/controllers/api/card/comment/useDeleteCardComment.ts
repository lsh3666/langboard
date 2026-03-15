import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteCardCommentForm {
    project_uid: string;
    card_uid: string;
    comment_uid: string;
}

const useDeleteCardComment = (options?: TMutationOptions<IDeleteCardCommentForm>) => {
    const { mutate } = useQueryMutation();

    const deleteCardComment = async (params: IDeleteCardCommentForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.COMMENT.UPDATE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            comment_uid: params.comment_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });
        return res.data;
    };

    const result = mutate(["delete-card-comment"], deleteCardComment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCardComment;
