import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Routing } from "@langboard/core/constants";

export interface IAddNewEmailForm {
    new_email: string;
    is_resend?: bool;
}

const useAddNewEmail = (options?: TMutationOptions<IAddNewEmailForm>) => {
    const { mutate } = useQueryMutation();

    const addNewEmail = async (params: IAddNewEmailForm) => {
        const res = await api.post(
            Routing.API.ACCOUNT.EMAIL.CRUD,
            {
                ...params,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["add-new-email"], addNewEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useAddNewEmail;
