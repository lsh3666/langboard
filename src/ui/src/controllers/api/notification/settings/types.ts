import { ENotificationChannel, TNotificationSpecificType } from "@/core/models/notification.type";

interface IBaseToggleSpecificScopedNotificationSettingsForm {
    channel: ENotificationChannel;
    is_unsubscribed: bool;
}

interface IProjectToggleSpecificScopedNotificationSettingsForm extends IBaseToggleSpecificScopedNotificationSettingsForm {
    project_uid: string;
}

interface IColumnToggleSpecificScopedNotificationSettingsForm extends IBaseToggleSpecificScopedNotificationSettingsForm {
    project_uid: string;
    project_column_uid: string;
}

interface ICardToggleSpecificScopedNotificationSettingsForm extends IBaseToggleSpecificScopedNotificationSettingsForm {
    project_uid: string;
    card_uid: string;
}

interface IWikiToggleSpecificScopedNotificationSettingsForm extends IBaseToggleSpecificScopedNotificationSettingsForm {
    project_uid: string;
    wiki_uid: string;
}

export type TToggleSpecificScopedNotificationSettingsForm<T extends TNotificationSpecificType> = T extends "project"
    ? IProjectToggleSpecificScopedNotificationSettingsForm
    : T extends "column"
      ? IColumnToggleSpecificScopedNotificationSettingsForm
      : T extends "card"
        ? ICardToggleSpecificScopedNotificationSettingsForm
        : T extends "wiki"
          ? IWikiToggleSpecificScopedNotificationSettingsForm
          : never;
