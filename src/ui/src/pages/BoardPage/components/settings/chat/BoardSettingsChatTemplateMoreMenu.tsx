import MoreMenu from "@/components/MoreMenu";
import { ChatTemplateModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import BoardSettingsChatTemplateMoreMenuDelete from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplateMoreMenuDelete";
import BoardSettingsChatTemplateMoreMenuEdit from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplateMoreMenuEdit";

export interface IBoardSettingsChatTemplateMoreMenuProps {
    chatTemplate: ChatTemplateModel.TModel;
}

function BoardSettingsChatTemplateMoreMenu({ chatTemplate }: IBoardSettingsChatTemplateMoreMenuProps): React.JSX.Element {
    return (
        <ModelRegistry.ChatTemplateModel.Provider model={chatTemplate}>
            <MoreMenu.Root triggerProps={{ className: "h-8 w-5 sm:size-8" }}>
                <BoardSettingsChatTemplateMoreMenuEdit />
                <BoardSettingsChatTemplateMoreMenuDelete />
            </MoreMenu.Root>
        </ModelRegistry.ChatTemplateModel.Provider>
    );
}

export default BoardSettingsChatTemplateMoreMenu;
