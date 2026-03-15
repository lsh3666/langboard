import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IChangePasswordForm {
    current_password: string;
    new_password: string;
}

const useChangePassword = (options?: TMutationOptions<IChangePasswordForm>) => {
    const { mutate } = useQueryMutation();

    const changePassword = async (params: IChangePasswordForm) => {
        const res = await api.put(Routing.API.ACCOUNT.CHANGE_PASSWORD, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["change-password"], changePassword, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangePassword;
