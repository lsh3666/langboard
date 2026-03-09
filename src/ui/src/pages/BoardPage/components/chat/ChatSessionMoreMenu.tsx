import Button from "@/components/base/Button";
import { TIconName, TIconProps } from "@/components/base/IconComponent";
import MoreMenu from "@/components/MoreMenu";
import { ChatSessionModel } from "@/core/models";
import ChatSessionMoreMenuDeleteSession from "@/pages/BoardPage/components/chat/ChatSessionMoreMenuDeleteSession";
import ChatSessionMoreMenuRetitle from "@/pages/BoardPage/components/chat/ChatSessionMoreMenuRetitle";
import { useTranslation } from "react-i18next";

export interface IChatSessionMoreMenuProps {
    icon: TIconName;
    iconSize: React.ComponentPropsWithoutRef<TIconProps>["size"];
    menuButtonProps?: React.ComponentPropsWithoutRef<typeof Button>;
    session?: ChatSessionModel.TModel;
}

function ChatSessionMoreMenu({ icon, iconSize, menuButtonProps, session }: IChatSessionMoreMenuProps) {
    const [t] = useTranslation();

    if (!session) {
        return null;
    }

    return (
        <MoreMenu.Root
            triggerProps={{
                title: t("project.Session menu"),
                titleSide: "bottom",
                ...menuButtonProps,
            }}
            triggerIcon={icon}
            triggerIconSize={iconSize}
            contentProps={{ align: "start" }}
        >
            <ChatSessionMoreMenuRetitle session={session} />
            <ChatSessionMoreMenuDeleteSession session={session} />
        </MoreMenu.Root>
    );
}

export default ChatSessionMoreMenu;
