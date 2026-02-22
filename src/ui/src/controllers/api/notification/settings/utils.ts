import { AuthUser } from "@/core/models";
import { ENotificationChannel, ENotificationScope, TNotificationType } from "@/core/models/types/notification.type";

interface IToggleAllScopedUnsubscriptionsParams {
    currentUser: AuthUser.TModel;
    types: TNotificationType[];
    channel: ENotificationChannel;
    isUnsubscribed: bool;
}

export const toggleAllScopedUnsubscriptions = ({ currentUser, types, channel, isUnsubscribed }: IToggleAllScopedUnsubscriptionsParams) => {
    const scope = ENotificationScope.All;

    const unsubscriptions = { ...(currentUser.notification_unsubs ?? {}) };
    if (isUnsubscribed) {
        if (!unsubscriptions[scope]) {
            unsubscriptions[scope] = {};
        }

        const unsubscriptionsByScope = { ...unsubscriptions[scope] };

        for (let i = 0; i < types.length; ++i) {
            const type = types[i];
            if (!unsubscriptionsByScope[type]) {
                unsubscriptionsByScope[type] = {};
            }

            const unsubscriptionsByType = { ...unsubscriptionsByScope[type] };

            unsubscriptionsByType[channel] = true;
            unsubscriptionsByScope[type] = unsubscriptionsByType;
        }

        unsubscriptions[scope] = unsubscriptionsByScope;
    } else if (unsubscriptions[scope]) {
        const unsubscriptionsByScope = { ...unsubscriptions[scope] };

        for (let i = 0; i < types.length; ++i) {
            const type = types[i];
            if (!unsubscriptionsByScope[type]) {
                continue;
            }

            const unsubscriptionsByType = { ...unsubscriptionsByScope[type] };

            delete unsubscriptionsByType[channel];
            unsubscriptionsByScope[type] = unsubscriptionsByType;
        }

        unsubscriptions[scope] = unsubscriptionsByScope;
    }

    currentUser.notification_unsubs = unsubscriptions;
};

interface IToggleSpecificScopedUnsubscriptionsParams {
    currentUser: AuthUser.TModel;
    types: TNotificationType[];
    channel: ENotificationChannel;
    specificUID: string;
    isUnsubscribed: bool;
}

export const toggleSpecificScopedUnsubscriptions = ({
    currentUser,
    types,
    channel,
    specificUID,
    isUnsubscribed,
}: IToggleSpecificScopedUnsubscriptionsParams) => {
    const scope = ENotificationScope.Specific;

    const unsubscriptions = { ...(currentUser.notification_unsubs ?? {}) };
    if (isUnsubscribed) {
        if (!unsubscriptions[scope]) {
            unsubscriptions[scope] = {};
        }

        const unsubscriptionsByScope = { ...unsubscriptions[scope] };

        for (let i = 0; i < types.length; ++i) {
            const type = types[i];
            if (!unsubscriptionsByScope[type]) {
                unsubscriptionsByScope[type] = {};
            }

            const unsubscriptionsByType = { ...unsubscriptionsByScope[type] };

            if (!unsubscriptionsByType[channel]) {
                unsubscriptionsByType[channel] = [];
            }

            const unsubscriptionsByChannel = [...unsubscriptionsByType[channel]].filter((uid) => uid !== specificUID);
            unsubscriptionsByChannel.push(specificUID);
            unsubscriptionsByType[channel] = unsubscriptionsByChannel;
            unsubscriptionsByScope[type] = unsubscriptionsByType;
        }

        unsubscriptions[scope] = unsubscriptionsByScope;
    } else if (unsubscriptions[scope]) {
        const unsubscriptionsByScope = { ...unsubscriptions[scope] };

        for (let i = 0; i < types.length; ++i) {
            const type = types[i];
            if (!unsubscriptionsByScope[type]) {
                continue;
            }

            const unsubscriptionsByType = { ...unsubscriptionsByScope[type] };
            if (!unsubscriptionsByType[channel]) {
                continue;
            }

            const unsubscriptionsByChannel = [...unsubscriptionsByType[channel]].filter((uid) => uid !== specificUID);
            unsubscriptionsByType[channel] = unsubscriptionsByChannel;
            unsubscriptionsByScope[type] = unsubscriptionsByType;
        }

        unsubscriptions[scope] = unsubscriptionsByScope;
    }

    currentUser.notification_unsubs = unsubscriptions;
};
