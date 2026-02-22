/* eslint-disable @typescript-eslint/no-explicit-any */
import { toggleAllScopedUnsubscriptions } from "@/controllers/api/notification/settings/utils";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AuthUser } from "@/core/models";
import { ENotificationChannel, TNotificationType } from "@/core/models/types/notification.type";

export interface IToggleAllScopedByTypeNotificationSettingsForm {
    channel: ENotificationChannel;
    type: TNotificationType;
    is_unsubscribed: bool;
}

const useToggleAllScopedByTypeNotificationSettings = (
    currentUser: AuthUser.TModel,
    options?: TMutationOptions<IToggleAllScopedByTypeNotificationSettingsForm>
) => {
    const { mutate } = useQueryMutation();

    const toggleAllScopedByTypeNotificationSettings = async (params: IToggleAllScopedByTypeNotificationSettingsForm) => {
        const res = await api.put(
            Routing.API.NOTIFICATION.SETTINGS.TYPE,
            {
                channel: params.channel,
                notification_type: params.type,
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

    const result = mutate(["toggle-all-scoped-by-type-notification-settings"], toggleAllScopedByTypeNotificationSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleAllScopedByTypeNotificationSettings;
