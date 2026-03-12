import { createBrowserRouter, Navigate, RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import { ROUTES } from "@/core/routing/constants";
import { memo, useEffect, useState } from "react";
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

export interface IRouterProps {
    children: React.ReactNode;
}

const Router = memo(({ children }: IRouterProps) => {
    const [routes, setRoutes] = useState<RouteObject[] | null>(null);
    const [isAllRoutesLoaded, setIsAllRoutesLoaded] = useState(false);

    useEffect(() => {
        let isDisposed = false;

        void loadRouteConfigs(pages).then((loadedConfigs) => {
            if (isDisposed) {
                return;
            }

            const initialConfigs = loadedConfigs.filter((routeConfig) => routeConfig.loadInitially);
            const initialRoutes = toRoutes(initialConfigs.length ? initialConfigs : loadedConfigs);
            const allRoutes = toRoutes(loadedConfigs);

            setRoutes(initialRoutes);
            useAuthStore.setState(() => ({
                pageLoaded: true,
            }));

            if (initialRoutes.length === allRoutes.length) {
                setIsAllRoutesLoaded(true);
                return;
            }

            setTimeout(() => {
                if (isDisposed) {
                    return;
                }

                setRoutes(allRoutes);
                setIsAllRoutesLoaded(true);
            }, 0);
        });

        return () => {
            isDisposed = true;
        };
    }, []);

    if (!routes) {
        return null;
    }

    const routeList: RouteObject[] = [
        ...routes,
        {
            path: "*",
            element: <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} />,
        },
    ];

    return (
        <RouterProvider
            key={isAllRoutesLoaded ? "all-routes" : "initial-routes"}
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
                    children: routeList,
                },
            ])}
        />
    );
});

export default Router;
