import Dialog from "@/components/base/Dialog";
import ActivityList from "@/components/ActivityList";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ROUTES } from "@/core/routing/constants";
import { useAuth } from "@/core/providers/AuthProvider";

function WikiActivityDialog(): React.JSX.Element | null {
    const navigate = usePageNavigateRef();
    const [projectUID, _, wikiUID] = location.pathname.split("/").slice(2);
    const { currentUser } = useAuth();

    const close = () => {
        navigate(ROUTES.BOARD.WIKI_PAGE(projectUID, wikiUID));
    };

    if (!wikiUID || !currentUser) {
        return null;
    }

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ listType: "ActivityModel", type: "project_wiki", project_uid: projectUID, wiki_uid: wikiUID }}
                    currentUser={currentUser}
                    outerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default WikiActivityDialog;
