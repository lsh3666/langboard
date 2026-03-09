/* eslint-disable @typescript-eslint/no-explicit-any */
import AnimatedList from "@/components/base/AnimatedList";
import Box from "@/components/base/Box";
import Button from "@/components/base/Button";
import Card from "@/components/base/Card";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Label from "@/components/base/Label";
import Loading from "@/components/base/Loading";
import Popover from "@/components/base/Popover";
import ScrollArea from "@/components/base/ScrollArea";
import Select from "@/components/base/Select";
import Switch from "@/components/base/Switch";
import Toast from "@/components/base/Toast";
import Tooltip from "@/components/base/Tooltip";
import DateDistance from "@/components/DateDistance";
import InfiniteScroller from "@/components/InfiniteScroller";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { QUERY_NAMES } from "@/constants";
import useGetNotificationList from "@/controllers/api/notification/useGetNotificationList";
import useDeleteAllUserNotificationsHandlers from "@/controllers/socket/notification/useDeleteAllUserNotificationsHandlers";
import useDeleteUserNotificationHandlers from "@/controllers/socket/notification/useDeleteUserNotificationHandlers";
import useReadAllUserNotificationsHandlers from "@/controllers/socket/notification/useReadAllUserNotificationsHandlers";
import useReadUserNotificationHandlers from "@/controllers/socket/notification/useReadUserNotificationHandlers";
import useUserNotifiedHandlers from "@/controllers/socket/user/useUserNotifiedHandlers";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { AuthUser, User, UserNotification } from "@/core/models";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { ENotificationType } from "@/core/models/types/notification.type";
import { useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { getUserSettingsStore, IUserSettings, NOTIFICATIONS_TIME_RANGE_OPTIONS, useUserSettings } from "@/core/stores/UserSettingsStore";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

interface IHeaderUserNotificationProps {
    currentUser: AuthUser.TModel;
}

const HeaderUserNotification = memo(({ currentUser }: IHeaderUserNotificationProps) => {
    const [t] = useTranslation();
    const socket = useSocket();
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const unreadNotifications = UserNotification.Model.useModels((model) => !model.read_at, [updated]);
    const [isOnlyUnread, setIsOnlyUnread] = useState(true);
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync } = useGetNotificationList();
    const timeRange = useUserSettings("notifications_time_range");
    const { send: sendReadAllUserNotifications } = useReadAllUserNotificationsHandlers();
    const { send: sendDeleteAllUserNotifications } = useDeleteAllUserNotificationsHandlers();
    const notifiedHandlers = useMemo(
        () =>
            useUserNotifiedHandlers({
                currentUser,
                callback: () => {
                    if (isOpened) {
                        return;
                    }

                    Toast.Add.info(t("notification.You have a new notification."));
                },
            }),
        [isOpened]
    );
    useSwitchSocketHandlers({ socket, handlers: notifiedHandlers, dependencies: [notifiedHandlers] });
    const readAllNotifications = useCallback(() => {
        sendReadAllUserNotifications({});
        for (let i = 0; i < unreadNotifications.length; ++i) {
            const notification = unreadNotifications[i];
            notification.read_at = new Date();
        }
    }, [unreadNotifications]);
    const deleteAllNotifications = useCallback(() => {
        sendDeleteAllUserNotifications({});
        UserNotification.Model.deleteModels(() => true);
    }, []);
    const updateTimeRange = (value: IUserSettings["notifications_time_range"]) => {
        getUserSettingsStore().updateSettingsByKey("notifications_time_range", value);
    };

    useEffect(() => {
        UserNotification.Model.deleteModels(() => true);
        mutateAsync({
            time_range: timeRange || "3d",
        });
    }, [timeRange]);

    return (
        <Popover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <Button
                    variant="ghost"
                    className="relative p-2"
                    title={t(unreadNotifications.length > 0 ? "notification.{count} notifications received" : "notification.Notifications", {
                        count: unreadNotifications.length,
                    })}
                >
                    <IconComponent icon="bell" />
                    {unreadNotifications.length > 0 && (
                        <Box
                            position="absolute"
                            top="0"
                            right={unreadNotifications.length > 99 ? "-1.5" : unreadNotifications.length > 9 ? "0.5" : "1.5"}
                            px="0.5"
                            rounded="sm"
                            textSize="xs"
                            className="bg-destructive text-destructive-foreground"
                        >
                            {unreadNotifications.length > 99 ? "99+" : unreadNotifications.length}
                        </Box>
                    )}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="min-w-[min(theme(screens.xs),100vw)] max-w-[min(theme(screens.xs),100vw)] p-0">
                <Flex items="center" justify="between" py="2.5" px="3" className="border-b">
                    <Flex items="center" gap="1.5" textSize="base" weight="semibold">
                        {t("notification.Notifications")}
                        <Select.Root value={timeRange || "3d"} onValueChange={updateTimeRange as any}>
                            <Select.Trigger className="h-8 gap-1 px-1.5 py-0.5 text-xs">
                                <Select.Value />
                            </Select.Trigger>
                            <Select.Content
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                {NOTIFICATIONS_TIME_RANGE_OPTIONS.map((option) => (
                                    <Select.Item key={`notification-time-range-${option}`} value={option}>
                                        {t(`notification.timeRanges.${option}`)}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Flex>
                    <Flex gap="1.5" items="center">
                        <Label display="inline-flex" cursor="pointer" items="center" gap="2" textSize="xs">
                            <Switch checked={isOnlyUnread} onCheckedChange={setIsOnlyUnread} />
                            <Box as="span">{t("notification.Only show unread")}</Box>
                        </Label>
                        {unreadNotifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                title={t("notification.Read all notifications")}
                                titleAlign="end"
                                titleSide="bottom"
                                onClick={readAllNotifications}
                            >
                                <IconComponent icon="check-check" size="4" />
                            </Button>
                        )}
                        <Button
                            variant="destructive-ghost"
                            size="icon-sm"
                            title={t("notification.Delete all notifications")}
                            titleAlign="end"
                            titleSide="bottom"
                            onClick={deleteAllNotifications}
                        >
                            <IconComponent icon="trash-2" size="4" />
                        </Button>
                    </Flex>
                </Flex>
                <HeaderUserNotificationList isOnlyUnread={isOnlyUnread} updater={[updated, forceUpdate]} />
            </Popover.Content>
        </Popover.Root>
    );
});

interface IHeaderUserNotificationListProps {
    isOnlyUnread: bool;
    updater: [number, React.DispatchWithoutAction];
}

function HeaderUserNotificationList({ isOnlyUnread, updater }: IHeaderUserNotificationListProps) {
    const [t] = useTranslation();
    const [updated] = updater;
    const flatNotifications = UserNotification.Model.useModels(() => true, [updated]);
    const filteredNotifications = useMemo(
        () =>
            flatNotifications
                .filter((notification) => (isOnlyUnread ? !notification.read_at : true))
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
        [flatNotifications, isOnlyUnread, updated]
    );
    const PAGE_SIZE = 5;
    const { items: notifications, nextPage, hasMore } = useInfiniteScrollPager({ allItems: filteredNotifications, size: PAGE_SIZE, updater });
    const viewportRef = useRef<HTMLDivElement | null>(null);

    return (
        <ScrollArea.Root viewportRef={viewportRef} mutable={updated}>
            {!notifications.length && (
                <Flex items="center" justify="center" maxH="80" minH="80">
                    {t("notification.No notifications received.")}
                </Flex>
            )}
            <InfiniteScroller.NoVirtual
                scrollable={() => viewportRef.current}
                loadMore={nextPage}
                hasMore={hasMore}
                loader={
                    <Flex justify="center" py="6" key={Utils.String.Token.shortUUID()}>
                        <Loading variant="secondary" size={{ initial: "2", sm: "3" }} />
                    </Flex>
                }
                className={cn(
                    "max-h-[min(theme(spacing.96),calc(100vh_-_theme(spacing.16)_-_theme(spacing.14)))]",
                    "min-h-[min(theme(spacing.96),calc(100vh_-_theme(spacing.16)_-_theme(spacing.14)))]",
                    "p-2"
                )}
            >
                <AnimatedList.Root>
                    {notifications.map((notification) => (
                        <AnimatedList.Item key={notification.uid}>
                            <HeaderUserNotificationItem notification={notification} updater={updater} />
                        </AnimatedList.Item>
                    ))}
                </AnimatedList.Root>
            </InfiniteScroller.NoVirtual>
        </ScrollArea.Root>
    );
}

interface IHeaderUserNotificationItemProps {
    notification: UserNotification.TModel;
    updater: [number, React.DispatchWithoutAction];
}

const HeaderUserNotificationItem = memo(({ notification, updater }: IHeaderUserNotificationItemProps) => {
    const [_, forceUpdate] = updater;
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { send: sendReadUserNotification } = useReadUserNotificationHandlers();
    const { send: sendDeleteUserNotification } = useDeleteUserNotificationHandlers();
    const readAt = notification.useField("read_at");
    const readNotification = (shouldUpdate: bool) => {
        sendReadUserNotification({ uid: notification.uid });
        notification.read_at = new Date();
        if (shouldUpdate) {
            forceUpdate();
        }
    };
    const deleteNotification = () => {
        sendDeleteUserNotification({ uid: notification.uid });
        UserNotification.Model.deleteModel(notification.uid);
    };

    const UserAvatarComp = ({ userOrBot }: { userOrBot?: TUserLikeModel }) => {
        if (!userOrBot) {
            return <></>;
        }

        return (
            <UserAvatar.Root
                userOrBot={userOrBot}
                avatarSize="xs"
                withNameProps={{
                    className: "inline-flex gap-1 cursor-pointer select-none",
                    nameClassName: "text-base",
                }}
            >
                <UserAvatarDefaultList userOrBot={userOrBot} scope={{ projectUID: notification.records.project?.uid }} />
            </UserAvatar.Root>
        );
    };

    const movePage = () => {
        const route = getRoute(notification);
        readNotification(false);
        navigate(route);
    };

    return (
        <Card.Root>
            <Card.Header className="p-3">
                <Flex items="center" gap="1" justify="between">
                    <Box
                        as="span"
                        display="inline-flex"
                        weight="semibold"
                        gap="1"
                        cursor="pointer"
                        className={cn("truncate text-primary hover:opacity-80", !!readAt && "opacity-50")}
                        onClick={movePage}
                    >
                        <Trans
                            i18nKey={`notification.titles.${notification.type}`}
                            components={{
                                Who: <UserAvatarComp userOrBot={notification.notifier_user ?? notification.notifier_bot} />,
                                Span: <Box as="span" className="truncate" />,
                            }}
                        />
                    </Box>
                    <Flex items="center" gap="1">
                        {!readAt && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                title={t("notification.Read notification")}
                                titleAlign="end"
                                titleSide="bottom"
                                className="size-7"
                                onClick={() => readNotification(true)}
                            >
                                <IconComponent icon="check" size="3" />
                            </Button>
                        )}
                        <Button
                            variant="destructive-ghost"
                            size="icon-sm"
                            title={t("notification.Delete notification")}
                            titleAlign="end"
                            titleSide="bottom"
                            className="size-7"
                            onClick={deleteNotification}
                        >
                            <IconComponent icon="trash-2" size="3" />
                        </Button>
                    </Flex>
                </Flex>
                <Card.Description className={cn("truncate text-xs", !!readAt && "opacity-50")}>
                    {t(`notification.subtitles.${notification.type}`, { records: notification.records })}
                </Card.Description>
            </Card.Header>
            <HeaderUserNotificationItemContent notification={notification} className={readAt ? "opacity-50" : ""} />
            <Card.Footer className={cn("justify-end px-3 pb-4", !!readAt && "opacity-50")}>
                <Card.Description className="text-xs">
                    <DateDistance date={notification.created_at} />
                </Card.Description>
            </Card.Footer>
        </Card.Root>
    );
});

function HeaderUserNotificationItemContent({ notification, className }: { notification: UserNotification.TModel; className?: string }) {
    const content = useMemo(() => {
        switch (notification.type) {
            case ENotificationType.MentionedInCard:
            case ENotificationType.MentionedInComment:
            case ENotificationType.MentionedInWiki:
            case ENotificationType.ReactedToComment:
                return <HeaderUserNotificationItemMentionedText content={notification.message_vars.line} />;
            default:
                return null;
        }
    }, []);

    if (!content) {
        return null;
    }

    return (
        <Card.Content className={cn("p-3 pt-0", className)}>
            <Flex items="center" textSize="sm" className="truncate rounded-md bg-muted px-3 py-2">
                {content}
            </Flex>
        </Card.Content>
    );
}

function HeaderUserNotificationItemMentionedText({ content }: { content: string }) {
    const mentionPattern = /\[\*\*@([\w-]+)\*\*\]\(([\w]+)\)/g;
    const [elements, title] = useMemo(() => {
        const newElements = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        let newTitle: string = "";
        while ((match = mentionPattern.exec(content)) !== null) {
            const [fullMatch, username, userUID] = match;
            const targetUser = User.Model.getModel(userUID);
            const userName = targetUser ? `${targetUser.firstname} ${targetUser.lastname}` : username;
            const matchIndex = match.index;

            if (matchIndex > lastIndex) {
                const textSegment = content.slice(lastIndex, matchIndex);
                newElements.push(
                    <Box as="span" key={`text-${lastIndex}`}>
                        {textSegment}
                    </Box>
                );
                newTitle = `${newTitle}${textSegment}`;
            }

            newElements.push(
                <Box
                    as="span"
                    key={`mention-${matchIndex}`}
                    className="cursor-default select-none rounded-full bg-primary/70 px-2 py-1 text-primary-foreground"
                >
                    @{userName}
                </Box>
            );
            newTitle = `${newTitle}@${userName}`;

            lastIndex = matchIndex + fullMatch.length;
        }

        if (lastIndex < content.length) {
            const textSegment = content.slice(lastIndex);
            newElements.push(
                <Box as="span" key={`text-${lastIndex}`}>
                    {textSegment}
                </Box>
            );
            newTitle = `${newTitle}${textSegment}`;
        }

        return [newElements, newTitle];
    }, [content]);

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <Box as="span" className="truncate">
                    {elements}
                </Box>
            </Tooltip.Trigger>
            <Tooltip.Content>{title}</Tooltip.Content>
        </Tooltip.Root>
    );
}

const getRoute = (notification: UserNotification.TModel) => {
    switch (notification.type) {
        case ENotificationType.ProjectInvited:
            return `${ROUTES.BOARD.INVITATION}?${QUERY_NAMES.PROJCT_INVITATION_TOKEN}=${notification.records.project_invitation.encrypted_token}`;
        case ENotificationType.MentionedInCard:
            return ROUTES.BOARD.CARD(notification.records.project.uid, notification.records.card.uid);
        case ENotificationType.MentionedInComment:
            return ROUTES.BOARD.CARD(notification.records.project.uid, notification.records.card.uid);
        case ENotificationType.MentionedInWiki:
            return ROUTES.BOARD.WIKI_PAGE(notification.records.project.uid, notification.records.project_wiki.uid);
        case ENotificationType.ReactedToComment:
            return ROUTES.BOARD.CARD(notification.records.project.uid, notification.records.card.uid);
        case ENotificationType.AssignedToCard:
            return ROUTES.BOARD.CARD(notification.records.project.uid, notification.records.card.uid);
        case ENotificationType.NotifiedFromChecklist:
            return ROUTES.BOARD.CARD(notification.records.project.uid, notification.records.card.uid);
        default:
            throw new Error("Invalid notification type.");
    }
};

export default HeaderUserNotification;
