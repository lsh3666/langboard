import Flex from "@/components/base/Flex";
import NotificationSetting from "@/components/NotificationSetting";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { memo } from "react";

const BoardCardNotificationSettings = memo(() => {
    const { projectUID, card, currentUser } = useBoardCard();

    return (
        <Flex inline>
            <NotificationSetting.SpecificScopedPopover
                type="card"
                form={{
                    project_uid: projectUID,
                    card_uid: card.uid,
                }}
                currentUser={currentUser}
                specificUID={card.uid}
                triggerProps={{
                    variant: "ghost",
                    size: "icon-sm",
                    className: "text-primary hover:text-primary",
                }}
                iconProps={{
                    size: "5",
                    strokeWidth: "3",
                }}
                onlyPopover
            />
        </Flex>
    );
});

export default BoardCardNotificationSettings;
