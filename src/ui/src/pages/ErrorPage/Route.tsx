import { RouteObject } from "react-router";
import { ROUTES } from "@/core/routing/constants";
import ErrorPage from "@/pages/ErrorPage";

const routes: RouteObject[] = [
    {
        path: ROUTES.ERROR("*").replace("/*", ""),
        children: [
            {
                path: ROUTES.ERROR("*"),
                element: <ErrorPage />,
            },
        ],
    },
];

export default {
    routes,
    loadInitially: true,
};
