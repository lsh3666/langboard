import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IIsProjectAvailableForm {
    uid: string;
}

export interface IIsProjectAvailableResponse {
    title: string;
}

const useIsProjectAvailable = (form: IIsProjectAvailableForm, options?: TQueryOptions<unknown, IIsProjectAvailableResponse>) => {
    const { query } = useQueryMutation();

    const isProjectAvailable = async () => {
        const url = Utils.String.format(Routing.API.BOARD.IS_AVAILABLE, { uid: form.uid });
        const res = await api.post(url, undefined, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = query(["is-project-available"], isProjectAvailable, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useIsProjectAvailable;
