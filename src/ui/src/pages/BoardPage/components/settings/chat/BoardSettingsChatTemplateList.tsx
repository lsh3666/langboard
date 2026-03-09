import Flex from "@/components/base/Flex";
import { ChatTemplateModel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsChatTemplate from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplate";
import BoardSettingsChatTemplateAddButton from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplateAddButton";
import { memo } from "react";

const BoardSettingsChatTemplateList = memo(() => {
    const { project } = useBoardSettings();
    const chatTemplates = ChatTemplateModel.Model.useModels((model) => model.filterable_table === "project" && model.filterable_uid === project.uid);

    return (
        <>
            <Flex direction="col" gap="2" py="4">
                {chatTemplates.map((chatTemplate) => (
                    <BoardSettingsChatTemplate key={chatTemplate.uid} chatTemplate={chatTemplate} />
                ))}
            </Flex>
            <BoardSettingsChatTemplateAddButton />
        </>
    );
});

export default BoardSettingsChatTemplateList;
