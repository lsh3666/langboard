import { Outlet, RouteObject } from "react-router";
import { ProtectedAuthRoute } from "@/core/routing/ProtectedAuthRoute";
import { ROUTES } from "@/core/routing/constants";
import SignInPage from "@/pages/auth/SignInPage";

const routes: RouteObject[] = [
    {
        path: ROUTES.SIGN_IN.EMAIL,
        element: (
            <ProtectedAuthRoute>
                <SignInPage />
                <Outlet />
            </ProtectedAuthRoute>
        ),
        children: [
            {
                index: true,
                element: <></>,
            },
            {
                path: ROUTES.SIGN_IN.PASSWORD,
                element: <></>,
            },
        ],
    },
];

export default {
    routes,
    loadInitially: true,
};
