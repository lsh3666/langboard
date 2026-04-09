import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IOidcLoginForm {
    redirect?: string;
}

export interface IOidcLoginResponse {
    authorize_url: string;
    state: string;
}

const useOidcLogin = (options?: TMutationOptions<IOidcLoginForm, IOidcLoginResponse>) => {
    const { mutate } = useQueryMutation();

    const oidcLogin = async (params: IOidcLoginForm) => {
        const res = await api.get<IOidcLoginResponse>("/auth/oidc/login", {
            params,
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["oidc-login"], oidcLogin, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useOidcLogin;
