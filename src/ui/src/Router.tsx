import { Await, createBrowserRouter, Navigate, RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import { ROUTES } from "@/core/routing/constants";
import { memo, Suspense } from "react";
import useAuthStore from "@/core/stores/AuthStore";
import SwallowErrorBoundary from "@/components/SwallowErrorBoundary";
import { EHttpStatus } from "@langboard/core/enums";

const modules = import.meta.glob<{ default: RouteObject[] }>("./pages/**/Route.tsx");
const pages = Object.values(modules);

const loadRoutes = async () => {
    const routes = (
        await Promise.all(
            pages.map(async (importPage) => {
                return (await importPage()).default;
            })
        )
    ).flat();

    routes.push({
        path: "*",
        element: <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} />,
    });

    useAuthStore.setState(() => ({
        pageLoaded: true,
    }));

    return routes;
};

export interface IRouterProps {
    children: React.ReactNode;
}

const Router = memo(({ children }: IRouterProps) => {
    return (
        <Suspense>
            <Await
                resolve={loadRoutes()}
                children={(routes) => (
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
