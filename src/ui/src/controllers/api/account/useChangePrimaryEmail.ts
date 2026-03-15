import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IChangePrimaryEmailForm {
    email: string;
}

const useChangePrimaryEmail = (options?: TMutationOptions<IChangePrimaryEmailForm>) => {
    const { mutate } = useQueryMutation();

    const changePrimaryEmail = async (params: IChangePrimaryEmailForm) => {
        const res = await api.put(Routing.API.ACCOUNT.EMAIL.CRUD, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["change-primary-email"], changePrimaryEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangePrimaryEmail;
