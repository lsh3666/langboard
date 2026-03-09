import { ROUTES } from "@/core/routing/constants";
import Redirect from "@/pages/HomePage/Redirect";
import { RouteObject } from "react-router";
import HomePage from "@/pages/HomePage";

const routes: RouteObject[] = [
    {
        path: "/",
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: ROUTES.REDIRECT,
                element: <Redirect />,
            },
        ],
    },
];

export default {
    routes,
    loadInitially: true,
};
