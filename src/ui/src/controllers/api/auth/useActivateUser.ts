import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IActivateUserForm {
    signup_token: string;
}

const useActivateUser = (options?: TMutationOptions<IActivateUserForm>) => {
    const { mutate } = useQueryMutation();

    const activateUser = async (params: IActivateUserForm) => {
        const res = await api.post(Routing.API.AUTH.SIGN_UP.ACTIVATE, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["sign-up-activate"], activateUser, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useActivateUser;
