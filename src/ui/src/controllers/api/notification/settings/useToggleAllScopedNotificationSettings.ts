/* eslint-disable @typescript-eslint/no-explicit-any */
import { toggleAllScopedUnsubscriptions } from "@/controllers/api/notification/settings/utils";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AuthUser } from "@/core/models";
import { ENotificationChannel, TNotificationSpecificType } from "@/core/models/types/notification.type";

export interface IToggleAllScopedNotificationSettingsForm {
    channel: ENotificationChannel;
    is_unsubscribed: bool;
}

const useToggleAllScopedNotificationSettings = (
    currentUser: AuthUser.TModel,
    type?: TNotificationSpecificType,
    options?: TMutationOptions<IToggleAllScopedNotificationSettingsForm>
) => {
    const { mutate } = useQueryMutation();

    let url;
    switch (type) {
        case "project":
            url = Routing.API.NOTIFICATION.SETTINGS.ALL_PROJECT;
            break;
        case "column":
            url = Routing.API.NOTIFICATION.SETTINGS.ALL_COLUMN;
            break;
        case "card":
            url = Routing.API.NOTIFICATION.SETTINGS.ALL_CARD;
            break;
        case "wiki":
            url = Routing.API.NOTIFICATION.SETTINGS.ALL_WIKI;
            break;
        default:
            url = Routing.API.NOTIFICATION.SETTINGS.ALL;
            break;
    }

    const toggleAllScopedNotificationSettings = async (params: IToggleAllScopedNotificationSettingsForm) => {
        const res = await api.put(
            url,
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

        toggleAllScopedUnsubscriptions({
            currentUser,
            types: res.data.notification_types,
            channel: params.channel,
            isUnsubscribed: params.is_unsubscribed,
        });

        return res.data;
    };

    const result = mutate(["toggle-all-scoped-notification-settings"], toggleAllScopedNotificationSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleAllScopedNotificationSettings;
