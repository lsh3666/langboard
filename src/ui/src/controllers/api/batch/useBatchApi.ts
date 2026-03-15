/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { EHttpStatus } from "@langboard/core/enums";

export interface IBatchApiSchema<TQuery = Record<string, any>, TForm = Record<string, any>> {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    query?: TQuery;
    form?: TForm;
}

export interface IBatchApiForm {
    request_schemas: IBatchApiSchema[];
}

export interface IBatchApiResponse {
    status: EHttpStatus;
    body: Record<string, any>;
}

const useBatchApi = (options?: TMutationOptions<IBatchApiForm>) => {
    const { mutate } = useQueryMutation();

    const batch = async (params: IBatchApiForm) => {
        const res = await api.post(Routing.API.BATCH, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["batch"], batch, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useBatchApi;
