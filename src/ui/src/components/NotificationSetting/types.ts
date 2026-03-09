import Button from "@/components/base/Button";
import { ILucideIconProps } from "@/components/base/IconComponent";
import { TToggleSpecificScopedNotificationSettingsForm } from "@/controllers/api/notification/settings/types";
import { AuthUser } from "@/core/models";
import { TNotificationSpecificType } from "@/core/models/types/notification.type";

export interface IBaseNotificationSettingPopoverProps {
    modal?: bool;
    triggerProps?: Omit<React.ComponentProps<typeof Button>, "children">;
    iconProps?: Omit<ILucideIconProps, "icon">;
    showTriggerText?: bool;
    onlyFlex?: bool;
    onlyPopover?: bool;
}

interface IBaseSpecificScopedPopoverProps extends IBaseNotificationSettingPopoverProps {
    type: TNotificationSpecificType;
    currentUser: AuthUser.TModel;
    specificUID: string;
}

interface IProjectSpecificScopedPopoverProps extends IBaseSpecificScopedPopoverProps {
    type: "project";
    form: Omit<TToggleSpecificScopedNotificationSettingsForm<"project">, "channel" | "is_unsubscribed">;
}

interface IColumnSpecificScopedPopoverProps extends IBaseSpecificScopedPopoverProps {
    type: "column";
    form: Omit<TToggleSpecificScopedNotificationSettingsForm<"column">, "channel" | "is_unsubscribed">;
}

interface IWikiSpecificScopedPopoverProps extends IBaseSpecificScopedPopoverProps {
    type: "wiki";
    form: Omit<TToggleSpecificScopedNotificationSettingsForm<"wiki">, "channel" | "is_unsubscribed">;
}

interface ICardSpecificScopedPopoverProps extends IBaseSpecificScopedPopoverProps {
    type: "card";
    form: Omit<TToggleSpecificScopedNotificationSettingsForm<"card">, "channel" | "is_unsubscribed">;
}

export type TSpecificScopedPopoverProps =
    | IProjectSpecificScopedPopoverProps
    | IColumnSpecificScopedPopoverProps
    | IWikiSpecificScopedPopoverProps
    | ICardSpecificScopedPopoverProps;
