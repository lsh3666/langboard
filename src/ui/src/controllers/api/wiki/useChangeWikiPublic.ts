import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeWikiPublicForm {
    project_uid: string;
    wiki_uid: string;
    is_public: bool;
}

const useChangeWikiPublic = (options?: TMutationOptions<IChangeWikiPublicForm>) => {
    const { mutate } = useQueryMutation();

    const changeWikiPublic = async (params: IChangeWikiPublicForm) => {
        const url = Utils.String.format(Routing.API.BOARD.WIKI.CHANGE_PUBLIC, {
            uid: params.project_uid,
            wiki_uid: params.wiki_uid,
        });
        const res = await api.put(
            url,
            {
                is_public: params.is_public,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["change-wiki-public"], changeWikiPublic, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeWikiPublic;
