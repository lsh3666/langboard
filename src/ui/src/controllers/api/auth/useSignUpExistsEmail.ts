import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface ISignUpExistsEmailForm {
    email: string;
}

interface ISignUpExistsEmailResponse {
    exists: bool;
}

const useSignUpExistsEmail = (options?: TMutationOptions<ISignUpExistsEmailForm, ISignUpExistsEmailResponse>) => {
    const { mutate } = useQueryMutation();

    const signUpExistsEmail = async (params: ISignUpExistsEmailForm) => {
        const res = await api.post(Routing.API.AUTH.SIGN_UP.EXISTS_EMAIL, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["sign-up-email-exists"], signUpExistsEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useSignUpExistsEmail;
