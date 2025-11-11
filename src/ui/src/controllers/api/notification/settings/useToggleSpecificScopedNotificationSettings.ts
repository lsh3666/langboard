/* eslint-disable @typescript-eslint/no-explicit-any */
import { TToggleSpecificScopedNotificationSettingsForm } from "@/controllers/api/notification/settings/types";
import { toggleSpecificScopedUnsubscriptions } from "@/controllers/api/notification/settings/utils";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AuthUser } from "@/core/models";
import { TNotificationSpecificType } from "@/core/models/notification.type";
import { Utils } from "@langboard/core/utils";

const useToggleSpecificScopedNotificationSettings = <TType extends TNotificationSpecificType>(
    type: TType,
    currentUser: AuthUser.TModel,
    options?: TMutationOptions<TToggleSpecificScopedNotificationSettingsForm<TType>>
) => {
    const { mutate } = useQueryMutation();

    let url;
    let getSpecificUID;
    switch (type) {
        case "project":
            url = Routing.API.NOTIFICATION.SETTINGS.PROJECT;
            getSpecificUID = (params: TToggleSpecificScopedNotificationSettingsForm<"project">) => params.project_uid;
            break;
        case "column":
            url = Routing.API.NOTIFICATION.SETTINGS.COLUMN;
            getSpecificUID = (params: TToggleSpecificScopedNotificationSettingsForm<"column">) => params.project_column_uid;
            break;
        case "card":
            url = Routing.API.NOTIFICATION.SETTINGS.CARD;
            getSpecificUID = (params: TToggleSpecificScopedNotificationSettingsForm<"card">) => params.card_uid;
            break;
        case "wiki":
            url = Routing.API.NOTIFICATION.SETTINGS.WIKI;
            getSpecificUID = (params: TToggleSpecificScopedNotificationSettingsForm<"wiki">) => params.wiki_uid;
            break;
        default:
            throw new Error("Invalid notification type");
    }

    const toggleSpecificScopedNotificationSettings = async (params: TToggleSpecificScopedNotificationSettingsForm<TType>) => {
        const formattedURL = Utils.String.format(url, {
            uid: params.project_uid,
            ...(params as unknown as Record<string, string>),
        });
        const res = await api.put(
            formattedURL,
            {
                channel: params.channel,
                is_unsubscribed: params.is_unsubscribed,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        toggleSpecificScopedUnsubscriptions({
            currentUser,
            types: res.data.notification_types,
            channel: params.channel,

            specificUID: getSpecificUID(params as any),
            isUnsubscribed: params.is_unsubscribed,
        });

        return res.data;
    };

    const result = mutate(["toggle-specific-scoped-notification-settings"], toggleSpecificScopedNotificationSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleSpecificScopedNotificationSettings;
