import { Navigate } from "react-router";
import { QUERY_NAMES } from "@/constants";
import { ROUTES } from "@/core/routing/constants";

export const RedirectToSignIn = (): React.JSX.Element => {
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has(QUERY_NAMES.REDIRECT)) {
        searchParams.set(QUERY_NAMES.REDIRECT, location.pathname + location.search);
    }

    return <Navigate to={`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`} />;
};
