import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

interface IBaseCheckEmailForm {
    sign_token: string;
}

interface ICheckEmailFormWithToken extends IBaseCheckEmailForm {
    is_token: true;
    token: string;
}

interface ICheckEmailFormWithEmail extends IBaseCheckEmailForm {
    is_token: false;
    email: string;
}

interface ICheckEmailResponse {
    token: string;
    email: string;
}

export type TCheckEmailForm = ICheckEmailFormWithToken | ICheckEmailFormWithEmail;

const useAuthEmail = (options?: TMutationOptions<TCheckEmailForm, ICheckEmailResponse>) => {
    const { mutate } = useQueryMutation();

    const checkEmail = async (params: TCheckEmailForm) => {
        const res = await api.post(Routing.API.AUTH.EMAIL, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["check-email"], checkEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useAuthEmail;
