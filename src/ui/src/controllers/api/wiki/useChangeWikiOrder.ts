import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IChangeWikiOrderForm {
    project_uid: string;
    wiki_uid: string;
    order: number;
}

const useChangeWikiOrder = (options?: TMutationOptions<IChangeWikiOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeWikiOrder = async (params: IChangeWikiOrderForm) => {
        const url = Utils.String.format(Routing.API.BOARD.WIKI.CHANGE_ORDER, {
            uid: params.project_uid,
            wiki_uid: params.wiki_uid,
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

    const result = mutate(["change-wiki-order"], changeWikiOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeWikiOrder;
