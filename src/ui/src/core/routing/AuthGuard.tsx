import { useTranslation } from "react-i18next";
import Toast from "@/components/base/Toast";
import { RedirectToSignIn } from "@/core/helpers/AuthHelper";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";

export interface IAuthGuardProps {
    children: React.ReactNode;
    message?: string;
}

export const AuthGuard = ({ children, message }: IAuthGuardProps): React.ReactNode => {
    const [t] = useTranslation();
    const { currentUser } = useAuth();
    const shouldSkip =
        location.pathname.startsWith(ROUTES.SIGN_IN.EMAIL) ||
        location.pathname.startsWith(ROUTES.SIGN_IN.OIDC_CALLBACK) ||
        location.pathname.startsWith(ROUTES.SIGN_UP.ROUTE) ||
        location.pathname.startsWith(ROUTES.ACCOUNT_RECOVERY.NAME);

    if (!currentUser && !shouldSkip) {
        if (message) {
            Toast.Add.error(t(message));
        }
        return <RedirectToSignIn />;
    }

    return children;
};
