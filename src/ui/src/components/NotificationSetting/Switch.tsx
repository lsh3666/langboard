import Box from "@/components/base/Box";
import Label from "@/components/base/Label";
import Switch from "@/components/base/Switch";
import { ENotificationChannel } from "@/core/models/types/notification.type";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

interface INotificationSettingChannelSwitchProps {
    channel: ENotificationChannel;
    toggle: (channel: ENotificationChannel, endCallback: () => void) => void;
    hasSubscription: bool;
}

const NotificationSettingChannelSwitch = memo(({ channel, toggle, hasSubscription }: INotificationSettingChannelSwitchProps) => {
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);

    const toggleChannel = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        toggle(channel, () => {
            setIsValidating(false);
        });
    };

    return (
        <Label
            display="inline-flex"
            cursor={isValidating ? "not-allowed" : "pointer"}
            items="center"
            gap="2"
            className={cn("transition-all", isValidating ? "opacity-70" : "hover:text-foreground/70")}
        >
            <Switch checked={hasSubscription} onCheckedChange={toggleChannel} disabled={isValidating} />
            <Box as="span">{t(`notification.settings.channels.${channel}`)}</Box>
        </Label>
    );
});

export default NotificationSettingChannelSwitch;
