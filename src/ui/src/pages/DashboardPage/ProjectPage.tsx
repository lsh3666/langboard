import { memo, useEffect } from "react";
import useGetProjects from "@/controllers/api/dashboard/useGetProjects";
import { ROUTES } from "@/core/routing/constants";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useDashboard } from "@/core/providers/DashboardProvider";
import ProjectTabs, { SkeletonProjecTabs } from "@/pages/DashboardPage/components/ProjectTabs";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { TProjectTab } from "@/pages/DashboardPage/constants";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EHttpStatus } from "@langboard/core/enums";

interface IProjectPageProps {
    currentTab: TProjectTab;
    updateStarredProjects: React.DispatchWithoutAction;
    scrollAreaUpdater: [number, React.DispatchWithoutAction];
}

const ProjectPage = memo(({ currentTab, updateStarredProjects, scrollAreaUpdater }: IProjectPageProps): React.JSX.Element => {
    const { setPageAliasRef } = usePageHeader();
    const navigate = usePageNavigateRef();
    const { currentUser } = useDashboard();
    const { data, isFetching, error } = useGetProjects();

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: {
                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true }),
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        setPageAliasRef.current("Dashboard");
        if (!data || isFetching || !currentUser) {
            return;
        }
    }, [currentUser, isFetching]);

    return (
        <>
            {!data || isFetching ? (
                <SkeletonProjecTabs />
            ) : (
                <ProjectTabs currentTab={currentTab} updateStarredProjects={updateStarredProjects} scrollAreaUpdater={scrollAreaUpdater} />
            )}
        </>
    );
});

export default ProjectPage;
