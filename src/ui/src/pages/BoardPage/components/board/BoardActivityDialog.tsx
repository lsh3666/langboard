import { Dialog } from "@/components/base";
import ActivityList from "@/components/ActivityList";
import { useAuth } from "@/core/providers/AuthProvider";

export interface IBoardActivityDialogProps {
    isOpened: bool;
    setIsOpened: (isOpened: bool) => void;
}

function BoardActivityDialog({ isOpened, setIsOpened }: IBoardActivityDialogProps): JSX.Element | null {
    const [projectUID] = location.pathname.split("/").slice(2);
    const { currentUser } = useAuth();

    if (!currentUser) {
        return null;
    }

    return (
        <Dialog.Root open={isOpened} onOpenChange={setIsOpened}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ listType: "ActivityModel", type: "project", project_uid: projectUID }}
                    currentUser={currentUser}
                    outerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}
BoardActivityDialog.displayName = "Board.ActivityDialog";

export default BoardActivityDialog;
