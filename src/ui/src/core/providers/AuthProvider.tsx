import { createContext, useContext, useEffect } from "react";
import { APP_SHORT_NAME } from "@/constants";
import { Routing } from "@langboard/core/constants";
import { api, refresh } from "@/core/helpers/Api";
import { useQueryMutation } from "@/core/helpers/QueryMutation";
import { AuthUser } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";
import { cleanModels } from "@/core/models/Base";
import { useTranslation } from "react-i18next";
import useAuthStore, { getAuthStore } from "@/core/stores/AuthStore";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import Progress from "@/components/base/Progress";
import useGetNotificationList from "@/controllers/api/notification/useGetNotificationList";
import { useUserSettings } from "@/core/stores/UserSettingsStore";

export interface IAuthContext {
    signIn: (accessToken: string, redirectCallback?: () => void) => Promise<void>;
    updatedUser: () => void;
    signOut: () => Promise<void>;
    currentUser: AuthUser.TModel | null;
}

interface IAuthProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    signIn: () => Promise.resolve(),
    updatedUser: () => {},
    signOut: async () => {},
    currentUser: null,
};

const AuthContext = createContext<IAuthContext>(initialContext);

const HAS_SET_LANG_STORAGE_KEY = `has-set-lang-${APP_SHORT_NAME}`;

export const AuthProvider = ({ children }: IAuthProviderProps): React.ReactNode => {
    const [_, i18n] = useTranslation();
    const { queryClient } = useQueryMutation();
    const { state, currentUser, pageLoaded, updateToken, removeToken } = useAuthStore();
    const { mutateAsync } = useGetNotificationList();
    const timeRange = useUserSettings("notifications_time_range");
    const navigate = usePageNavigateRef();

    useEffect(() => {
        if (state !== "loaded" || !currentUser) {
            return;
        }

        const hasSetLang = localStorage.getItem(HAS_SET_LANG_STORAGE_KEY);
        if (!hasSetLang) {
            i18n.changeLanguage(currentUser.preferred_lang);
            localStorage.setItem(HAS_SET_LANG_STORAGE_KEY, "true");
        }
    }, [state]);

    useEffect(() => {
        const shouldSkip =
            location.pathname.startsWith(ROUTES.SIGN_IN.EMAIL) ||
            location.pathname.startsWith(ROUTES.SIGN_UP.ROUTE) ||
            location.pathname.startsWith(ROUTES.ACCOUNT_RECOVERY.NAME);

        switch (state) {
            case "initial":
                refresh().finally(() => {
                    if (!getAuthStore().pageLoaded) {
                        return;
                    }

                    mutateAsync({
                        time_range: timeRange || "3d",
                    });
                });
                return;
            case "loaded":
                if (!currentUser && !shouldSkip) {
                    navigate(ROUTES.SIGN_IN.EMAIL);
                }
                return;
        }
    }, [state]);

    const updatedUser = () => {
        refresh();
    };

    const signIn = async (accessToken: string, redirectCallback?: () => void) => {
        await updateToken(accessToken, api);
        redirectCallback?.();
    };

    const signOut = async () => {
        await api.post(Routing.API.AUTH.SIGN_OUT);
        cleanModels();
        removeToken();
        queryClient.clear();
        navigate(ROUTES.SIGN_IN.EMAIL);
    };

    return (
        <AuthContext.Provider
            value={{
                signIn,
                updatedUser,
                signOut,
                currentUser,
            }}
        >
            {(!pageLoaded || state !== "loaded") && <Progress indeterminate height="1" className="fixed top-0 z-[9999999]" />}
            {state === "loaded" ? children : null}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
