import MoreMenu from "@/components/MoreMenu";
import BoardSettingsLabelMoreMenuChangeDescription from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelMoreMenuChangeDescription";
import BoardSettingsLabelMoreMenuDelete from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelMoreMenuDelete";
import BoardSettingsLabelMoreMenuRename from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelMoreMenuRename";

function BoardSettingsLabelMoreMenu(): React.JSX.Element {
    return (
        <MoreMenu.Root modal={false} triggerProps={{ className: "h-8 w-5 sm:size-8" }}>
            <BoardSettingsLabelMoreMenuRename />
            <BoardSettingsLabelMoreMenuChangeDescription />
            <BoardSettingsLabelMoreMenuDelete />
        </MoreMenu.Root>
    );
}

export default BoardSettingsLabelMoreMenu;
