import { Await, createBrowserRouter, Navigate, RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import { ROUTES } from "@/core/routing/constants";
import { memo, Suspense, useMemo } from "react";
import useAuthStore from "@/core/stores/AuthStore";
import SwallowErrorBoundary from "@/components/SwallowErrorBoundary";
import { EHttpStatus } from "@langboard/core/enums";

interface IRouteConfig {
    routes: RouteObject[];
    loadInitially: bool;
}

type TRouteModule = { default: IRouteConfig };
type TRouteImporter = () => Promise<TRouteModule>;

const pages = Object.values(import.meta.glob<TRouteModule>("./pages/**/Route.tsx"));

const loadRouteConfigs = async (importers: TRouteImporter[]) => {
    return Promise.all(
        importers.map(async (importPage) => {
            return (await importPage()).default;
        })
    );
};

const toRoutes = (routeConfigs: IRouteConfig[]) => routeConfigs.flatMap((routeConfig) => routeConfig.routes);
const loadRoutes = async () => {
    const routes = [
        ...toRoutes(await loadRouteConfigs(pages)),
        {
            path: "*",
            element: <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} />,
        },
    ];

    useAuthStore.setState(() => ({
        pageLoaded: true,
    }));

    return routes;
};

export interface IRouterProps {
    children: React.ReactNode;
}

const Router = memo(({ children }: IRouterProps) => {
    const routesPromise = useMemo(() => loadRoutes(), []);

    return (
        <Suspense>
            <Await
                resolve={routesPromise}
                children={(routes: RouteObject[]) => (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                path: "/",
                                element: (
                                    <SwallowErrorBoundary>
                                        <SuspenseComponent shouldWrapChildren={false} isPage>
                                            {children}
                                        </SuspenseComponent>
                                    </SwallowErrorBoundary>
                                ),
                                children: routes,
                            },
                        ])}
                    />
                )}
            />
        </Suspense>
    );
});

export default Router;
