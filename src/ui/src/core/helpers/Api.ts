import axios, { AxiosRequestConfig } from "axios";
import pako from "pako";
import { API_URL } from "@/constants";
import { Routing } from "@langboard/core/constants";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { getAuthStore } from "@/core/stores/AuthStore";
import { Utils } from "@langboard/core/utils";
import { EHttpStatus } from "@langboard/core/enums";

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    transformRequest: (axios.defaults.transformRequest
        ? Array.isArray(axios.defaults.transformRequest)
            ? axios.defaults.transformRequest
            : [axios.defaults.transformRequest]
        : []
    ).concat((data, headers) => {
        if (Utils.Type.isString(data) && data.length > 1024) {
            headers["Content-Encoding"] = "gzip";
            return pako.gzip(data);
        } else {
            headers["Content-Encoding"] = undefined;
            return data;
        }
    }),
});

export const refresh = async (): Promise<bool> => {
    const authStore = getAuthStore();

    try {
        const response = await api.post(Routing.API.AUTH.REFRESH);

        if (response.status !== EHttpStatus.HTTP_200_OK) {
            authStore.removeToken();
            throw new Error("Failed to refresh token");
        }

        authStore.updateToken(response.data.access_token, api);
        return true;
    } catch (e) {
        authStore.removeToken();
        return false;
    }
};

api.interceptors.request.use(
    async (config) => {
        const authStore = getAuthStore();
        const accessToken = authStore.getToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
    {
        runWhen: (config) => {
            return !config.url?.endsWith(Routing.API.AUTH.REFRESH);
        },
    }
);

api.interceptors.response.use(
    (value) => value,
    async (error) => {
        const interceptToast = error.config?.env?.interceptToast;
        const { handleAsync } = setupApiErrorHandler({
            code: {
                message: (e) => {
                    throw e;
                },
                toast: !interceptToast,
            },
            network: {
                message: (e) => {
                    throw e;
                },
                toast: !interceptToast,
            },
            nonApi: {
                message: (e) => {
                    throw e;
                },
                toast: !interceptToast,
            },
            wildcard: {
                message: (e) => {
                    throw e;
                },
                toast: !interceptToast,
            },
            [EHttpStatus.HTTP_401_UNAUTHORIZED]: {
                message: (e) => {
                    const authStore = getAuthStore();
                    authStore.removeToken();
                    throw e;
                },
                toast: !interceptToast,
            },
            [EHttpStatus.HTTP_422_UNPROCESSABLE_CONTENT]: {
                message: async (e) => {
                    const authStore = getAuthStore();
                    const originalConfig: AxiosRequestConfig = e.config!;
                    const isRefreshed = await refresh();
                    if (!isRefreshed) {
                        return;
                    }
                    originalConfig.headers!.Authorization = `Bearer ${authStore.getToken()}`;
                    return await api(originalConfig);
                },
            },
        });

        const result = await handleAsync(error);
        return result;
    }
);
