import { Box, Button, Flex, IconComponent, Popover, Toast } from "@/components/base";
import NotificationSettingChannelSwitch from "@/components/NotificationSetting/Switch";
import { IBaseNotificationSettingPopoverProps } from "@/components/NotificationSetting/types";
import useToggleAllScopedNotificationSettings from "@/controllers/api/notification/settings/useToggleAllScopedNotificationSettings";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { AuthUser } from "@/core/models";
import {
    ALL_NOTIFICATION_TYPES,
    ENotificationChannel,
    ENotificationScope,
    FLAT_NOTIFICATION_TYPE_MAP,
    TNotificationSpecificType,
} from "@/core/models/types/notification.type";
import { Utils } from "@langboard/core/utils";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface IAllScopedSwitchListProps extends IBaseNotificationSettingPopoverProps {
    currentUser: AuthUser.TModel;
    type?: TNotificationSpecificType;
}

const AllScopedSwitchList = memo(({ modal, currentUser, type, triggerProps, iconProps, onlyFlex, onlyPopover }: IAllScopedSwitchListProps) => {
    const [t] = useTranslation();
    const unsubscriptions = currentUser.useField("notification_unsubs");
    const subscribedChannelMap = useMemo(
        () => ({
            [ENotificationChannel.Web]: hasSubscription(unsubscriptions, ENotificationChannel.Web, type),
            [ENotificationChannel.Email]: hasSubscription(unsubscriptions, ENotificationChannel.Email, type),
            [ENotificationChannel.Mobile]: hasSubscription(unsubscriptions, ENotificationChannel.Mobile, type),
            [ENotificationChannel.IoT]: hasSubscription(unsubscriptions, ENotificationChannel.IoT, type),
        }),
        [unsubscriptions]
    );
    const { mutateAsync } = useToggleAllScopedNotificationSettings(currentUser, type, { interceptToast: true });

    const toggle = (channel: ENotificationChannel, endCallback: () => void) => {
        const promise = mutateAsync({
            channel,
            is_unsubscribed: subscribedChannelMap[channel],
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Notification settings updated successfully.");
            },
            finally: () => {
                endCallback();
            },
        });
    };

    return (
        <>
            <Box items="center" gap="2" wrap display={onlyFlex ? "flex" : onlyPopover ? "hidden" : { initial: "hidden", sm: "flex" }}>
                {Object.keys(ENotificationChannel).map((channelKey) => (
                    <NotificationSettingChannelSwitch
                        key={Utils.String.Token.shortUUID()}
                        channel={ENotificationChannel[channelKey]}
                        toggle={toggle}
                        hasSubscription={subscribedChannelMap[ENotificationChannel[channelKey]]}
                    />
                ))}
            </Box>
            <Box display={onlyFlex ? "hidden" : onlyPopover ? "block" : { sm: "hidden" }}>
                <Popover.Root modal={modal}>
                    <Popover.Trigger asChild>
                        <Button {...triggerProps}>
                            <IconComponent icon="bell-ring" {...iconProps} />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content className="w-auto p-3">
                        <Flex direction="col" gap="2.5">
                            {Object.keys(ENotificationChannel).map((channelKey) => (
                                <NotificationSettingChannelSwitch
                                    key={Utils.String.Token.shortUUID()}
                                    channel={ENotificationChannel[channelKey]}
                                    toggle={toggle}
                                    hasSubscription={subscribedChannelMap[ENotificationChannel[channelKey]]}
                                />
                            ))}
                        </Flex>
                    </Popover.Content>
                </Popover.Root>
            </Box>
        </>
    );
});

const hasSubscription = (
    unsubscriptions: AuthUser.TModel["notification_unsubs"],
    channel: ENotificationChannel,
    type?: TNotificationSpecificType
) => {
    const unsubscribedTypes = Object.keys(unsubscriptions?.[ENotificationScope.All] ?? {});
    const notificationTypes = type ? FLAT_NOTIFICATION_TYPE_MAP[type] : ALL_NOTIFICATION_TYPES;
    for (let i = 0; i < notificationTypes.length; ++i) {
        const notificationType = notificationTypes[i];
        if (!unsubscribedTypes.includes(notificationType)) {
            continue;
        }

        const channelUnsubscriptions = unsubscriptions[ENotificationScope.All]?.[notificationType]?.[channel];
        if (channelUnsubscriptions) {
            return false;
        }
    }
    return true;
};

export default AllScopedSwitchList;
