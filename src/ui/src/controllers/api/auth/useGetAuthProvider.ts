import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export type TAuthProvider = "local" | "oidc" | "hybrid";

export interface IGetAuthProviderResponse {
    provider: TAuthProvider;
    oidc_enabled: bool;
    scim_enabled: bool;
}

type TUseGetAuthProviderOptions = Omit<TQueryOptions<IGetAuthProviderResponse>, "queryKey" | "queryFn">;

const useGetAuthProvider = (options?: TUseGetAuthProviderOptions) => {
    const { query } = useQueryMutation();

    const getAuthProvider = async () => {
        const res = await api.get<IGetAuthProviderResponse>("/auth/provider", {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = query(["get-auth-provider"], getAuthProvider, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetAuthProvider;
