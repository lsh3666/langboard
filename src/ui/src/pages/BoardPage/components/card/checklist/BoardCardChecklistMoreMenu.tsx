import MoreMenu from "@/components/MoreMenu";
import BoardCardChecklistMoreMenuDelete from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistMoreMenuDelete";
import BoardCardChecklistMoreMenuEdit from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistMoreMenuEdit";

function BoardCardChecklistMoreMenu(): React.JSX.Element {
    return (
        <MoreMenu.Root modal={false} triggerProps={{ className: "h-8 w-5 sm:size-8" }}>
            <BoardCardChecklistMoreMenuEdit />
            <BoardCardChecklistMoreMenuDelete />
        </MoreMenu.Root>
    );
}

export default BoardCardChecklistMoreMenu;
