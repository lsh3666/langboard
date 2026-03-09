import Flex from "@/components/base/Flex";
import { ChatTemplateModel } from "@/core/models";
import BoardSettingsChatTemplateMoreMenu from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplateMoreMenu";
import { memo } from "react";

interface IBoardSettingsChatTemplatetProps {
    chatTemplate: ChatTemplateModel.TModel;
}

const BoardSettingsChatTemplate = memo(({ chatTemplate }: IBoardSettingsChatTemplatetProps) => {
    const name = chatTemplate.useField("name");

    return (
        <Flex items="center" justify="between" gap="3">
            <span className="truncate">{name}</span>
            <BoardSettingsChatTemplateMoreMenu chatTemplate={chatTemplate} />
        </Flex>
    );
});

export default BoardSettingsChatTemplate;
