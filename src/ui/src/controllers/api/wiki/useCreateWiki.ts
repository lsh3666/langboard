import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectWiki } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface ICreateWikiForm {
    project_uid: string;
    title: string;
}

export interface ICreateWikiResponse {
    wiki: ProjectWiki.TModel;
}

const useCreateWiki = (options?: TMutationOptions<ICreateWikiForm, ICreateWikiResponse>) => {
    const { mutate } = useQueryMutation();

    const createWiki = async (params: ICreateWikiForm) => {
        const url = Utils.String.format(Routing.API.BOARD.WIKI.CREATE, {
            uid: params.project_uid,
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

        return {
            wiki: ProjectWiki.Model.fromOne(res.data.wiki, true),
        };
    };

    const result = mutate<ICreateWikiForm, ICreateWikiResponse>(["create-wiki"], createWiki, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateWiki;
