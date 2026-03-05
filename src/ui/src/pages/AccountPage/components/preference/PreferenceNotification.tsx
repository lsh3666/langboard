/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from "react-i18next";
import { Box, Flex } from "@/components/base";
import { Utils } from "@langboard/core/utils";
import { cn } from "@/core/utils/ComponentUtils";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import { DEEP_NOTIFICATION_TYPE_MAP, TNotificationSpecificType, TNotificationType } from "@/core/models/types/notification.type";
import NotificationSetting from "@/components/NotificationSetting";

function PreferenceNotification() {
    const [t] = useTranslation();

    return (
        <Box pb="3" className="max-w-screen-sm">
            <h4 className="mb-2 text-lg font-semibold tracking-tight">{t("notification.settings.Notification settings")}</h4>
            <Box px="4" py="3" rounded="md" border>
                <PreferenceNotificationRecursive typeMap={DEEP_NOTIFICATION_TYPE_MAP as any} deep={0} />
            </Box>
        </Box>
    );
}

interface IPreferenceNotificationRecursiveProps {
    typeMap: Record<TNotificationSpecificType, TNotificationType[] | Record<TNotificationSpecificType, TNotificationType[]>>;
    deep: number;
}

function PreferenceNotificationRecursive({ typeMap, deep }: IPreferenceNotificationRecursiveProps): React.JSX.Element {
    const { currentUser } = useAccountSetting();
    const [t] = useTranslation();

    const style = {
        "--deep": deep.toString(),
    } as React.CSSProperties;

    const verticalLineClassNames = cn(
        "after:absolute after:left-0 after:top-7 after:w-px after:bg-border",
        "after:h-[calc(100%_-_theme(spacing.9)_-_2px)]"
    );

    const horizontalLineClassNames = cn(
        "after:w-3 after:absolute after:-left-[calc(theme(spacing.4))]",
        "after:top-1/2 after:h-px after:-translate-y-1/2 after:bg-border",
        "last:after:-left-[calc(theme(spacing.8))] last:after:w-7"
    );

    return (
        <Flex position="relative" direction="col" gap="3" ml={deep ? "4" : undefined} style={style}>
            {Object.entries(typeMap).map(([typeKey, types]) => {
                return (
                    <Box key={Utils.String.Token.shortUUID()} className={cn("relative", verticalLineClassNames)}>
                        <Flex
                            position="relative"
                            weight="semibold"
                            mb="2"
                            items="center"
                            justify="between"
                            h="8"
                            className={deep ? horizontalLineClassNames : ""}
                        >
                            <Box className="tracking-tight">{t(`notification.settings.typeKeyMap.${typeKey}`)}</Box>
                            <NotificationSetting.AllScopedPopover
                                currentUser={currentUser}
                                type={typeKey}
                                triggerProps={{
                                    variant: "ghost",
                                    size: "icon-sm",
                                    className: "ml-2.5 text-primary hover:text-primary",
                                }}
                                iconProps={{
                                    size: "5",
                                    strokeWidth: "3",
                                }}
                            />
                        </Flex>
                        {!Utils.Type.isArray(types) ? (
                            <PreferenceNotificationRecursive typeMap={types} deep={++deep} />
                        ) : (
                            <Flex direction="col" gap="2">
                                {types.map((type) => (
                                    <Flex key={Utils.String.Token.shortUUID()} items="center" justify="between" h="8">
                                        <Box position="relative" ml="4" textSize="sm" className={cn(horizontalLineClassNames)}>
                                            {t(`notification.settings.types.${type}`)}
                                        </Box>
                                        <NotificationSetting.AllScopedByTypePopover
                                            currentUser={currentUser}
                                            type={type}
                                            triggerProps={{
                                                variant: "ghost",
                                                size: "icon-sm",
                                                className: "ml-2.5 text-primary hover:text-primary",
                                            }}
                                            iconProps={{
                                                size: "5",
                                                strokeWidth: "3",
                                            }}
                                        />
                                    </Flex>
                                ))}
                            </Flex>
                        )}
                    </Box>
                );
            })}
        </Flex>
    );
}

export default PreferenceNotification;
