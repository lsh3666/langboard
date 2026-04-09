import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IOidcCallbackForm {
    code: string;
    state: string;
}

export interface IOidcCallbackResponse {
    access_token: string;
    redirect?: string;
}

const useOidcCallback = (options?: TMutationOptions<IOidcCallbackForm, IOidcCallbackResponse>) => {
    const { mutate } = useQueryMutation();

    const oidcCallback = async (params: IOidcCallbackForm) => {
        const res = await api.get<IOidcCallbackResponse>("/auth/oidc/callback", {
            params,
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["oidc-callback"], oidcCallback, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useOidcCallback;
