import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IUpdateWikiAssigneesForm {
    project_uid: string;
    wiki_uid: string;
    assignees: string[];
}

const useUpdateWikiAssignees = (options?: TMutationOptions<IUpdateWikiAssigneesForm>) => {
    const { mutate } = useQueryMutation();

    const updateWikiAssignees = async (params: IUpdateWikiAssigneesForm) => {
        const url = Utils.String.format(Routing.API.BOARD.WIKI.UPDATE_ASSIGNEES, {
            uid: params.project_uid,
            wiki_uid: params.wiki_uid,
        });
        const res = await api.put(
            url,
            {
                assignees: params.assignees,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["update-wiki-assignees"], updateWikiAssignees, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateWikiAssignees;
