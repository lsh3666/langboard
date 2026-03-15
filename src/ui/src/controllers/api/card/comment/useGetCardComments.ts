import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCardComment } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IGetCardCommentsForm {
    project_uid: string;
    card_uid: string;
}

export interface IGetCardCommentsResponse {
    comments: ProjectCardComment.TModel[];
}

const useGetCardComments = (params: IGetCardCommentsForm, options?: TQueryOptions<unknown, IGetCardCommentsResponse>) => {
    const { query } = useQueryMutation();

    const getCardComments = async () => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.COMMENT.GET_LIST, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        const comments = ProjectCardComment.Model.fromArray(res.data.comments);

        ProjectCardComment.Model.deleteModels(
            (model) => model.card_uid === params.card_uid && !comments.some((comment: ProjectCardComment.TModel) => comment.uid === model.uid)
        );

        return {
            comments: ProjectCardComment.Model.fromArray(res.data.comments),
        };
    };

    const result = query([`get-card-comments-${params.card_uid}`], getCardComments, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetCardComments;
