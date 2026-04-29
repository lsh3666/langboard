import MultiSelectAssignee, { IFormProps, TSaveHandler } from "@/components/MultiSelectAssignee";
import { useCollaborativeText } from "@/components/Collaborative/useCollaborativeText";
import Toast from "@/components/base/Toast";
import { EMAIL_REGEX } from "@/constants";
import useUpdateProjectAssignedUsers from "@/controllers/api/board/useUpdateProjectAssignedUsers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel, User } from "@/core/models";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { ProjectRole } from "@/core/models/roles";
import { useBoard } from "@/core/providers/BoardProvider";
import { getInviteEmails, parseBoardMemberItems, serializeBoardMemberItems } from "@/core/utils/CollaborativeSelectionUtils";
import { cn } from "@/core/utils/ComponentUtils";
import { EEditorCollaborationType } from "@langboard/core/constants";
import { Utils } from "@langboard/core/utils";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardMemberListProps {
    isSelectCardView: bool;
}

interface IBoardMemberSelectionMeta {
    added: bool;
    key: string;
    kind: "email" | "member";
    updatedAt: number;
}

const BoardMemberList = memo(({ isSelectCardView }: IBoardMemberListProps) => {
    const [t] = useTranslation();
    const { project, currentUser, hasRoleAction } = useBoard();
    const canEdit = hasRoleAction(ProjectRole.EAction.Update);
    const ownerUID = project.useField("owner_uid");
    const allMemebers = project.useForeignFieldArray("all_members");
    const invitedMemberUIDs = project.useField("invited_member_uids");
    const currentUserUID = currentUser.useField("uid");
    const groups = currentUser.useForeignFieldArray("user_groups");
    const collaborativeSelectables = useMemo(() => allMemebers.filter((model) => model.uid !== ownerUID), [allMemebers, ownerUID]);
    const allSelectables = useMemo(
        () => collaborativeSelectables.filter((model) => model.uid !== currentUserUID),
        [collaborativeSelectables, currentUserUID]
    );
    const showableAssignees = useMemo(
        () => [...allMemebers.filter((model) => model.isValidUser() && !invitedMemberUIDs.includes(model.uid))].slice(0, 6),
        [allMemebers, invitedMemberUIDs]
    );
    const selectedAssignees = useMemo(() => allMemebers.filter((model) => model.uid !== ownerUID), [allMemebers, ownerUID]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const { mutateAsync: updateProjectAssignedUsersMutateAsync } = useUpdateProjectAssignedUsers({ interceptToast: true });
    const defaultSelectedValues = useMemo(() => serializeBoardMemberItems(selectedAssignees), [selectedAssignees]);
    const { remoteMeta, updateMeta, updateValue, value } = useCollaborativeText({
        defaultValue: defaultSelectedValues,
        disabled: !isPopoverOpen,
        collaborationType: EEditorCollaborationType.BoardSettings,
        uid: project.uid,
        section: "members",
        field: "selected-values",
    });
    const collaborativeItems = useMemo(
        () => parseBoardMemberItems(value, selectedAssignees, collaborativeSelectables),
        [collaborativeSelectables, selectedAssignees, value]
    );
    const collaborativeSelectedAssignees = useMemo(
        () => collaborativeItems.filter((item): item is TUserLikeModel => !Utils.Type.isString(item)),
        [collaborativeItems]
    );
    const collaborativeInviteEmails = useMemo(
        () => collaborativeItems.filter((item): item is string => Utils.Type.isString(item)),
        [collaborativeItems]
    );
    const hiddenCurrentUserAssignee = useMemo(
        () =>
            collaborativeSelectedAssignees.find((item) => item.uid === currentUserUID) ??
            selectedAssignees.find((item) => item.uid === currentUserUID),
        [collaborativeSelectedAssignees, currentUserUID, selectedAssignees]
    );
    const visibleCollaborativeSelectedAssignees = useMemo(
        () => collaborativeSelectedAssignees.filter((item) => item.uid !== currentUserUID),
        [collaborativeSelectedAssignees, currentUserUID]
    );
    const displayItems = useMemo(
        () => [...visibleCollaborativeSelectedAssignees, ...collaborativeInviteEmails],
        [collaborativeInviteEmails, visibleCollaborativeSelectedAssignees]
    );
    const lastRenderedItemsRef = useRef<(string | TUserLikeModel)[]>(displayItems);
    const isSyncingFromRemoteRef = useRef(false);
    const remoteAddedMetaMaps = useMemo(() => {
        return remoteMeta.reduce<{
            emails: Record<string, { actorName: string; borderColor: string; updatedAt: number }>;
            members: Record<string, { actorName: string; borderColor: string; updatedAt: number }>;
        }>(
            (acc, meta) => {
                const value = meta.value;
                if (
                    !value ||
                    !Utils.Type.isObject(value) ||
                    !Utils.Type.isString((value as Record<string, unknown>).key) ||
                    !Utils.Type.isString((value as Record<string, unknown>).kind) ||
                    !Utils.Type.isBool((value as Record<string, unknown>).added) ||
                    !Utils.Type.isNumber((value as Record<string, unknown>).updatedAt)
                ) {
                    return acc;
                }

                const parsedValue = value as IBoardMemberSelectionMeta;
                if (!parsedValue.added) {
                    return acc;
                }

                const target = parsedValue.kind === "email" ? acc.emails : acc.members;
                const previous = target[parsedValue.key];
                if (!previous || previous.updatedAt < parsedValue.updatedAt) {
                    target[parsedValue.key] = {
                        actorName: meta.name,
                        borderColor: meta.color,
                        updatedAt: parsedValue.updatedAt,
                    };
                }

                return acc;
            },
            { emails: {}, members: {} }
        );
    }, [remoteMeta]);
    const pendingSerializedSelectionRef = useRef<string | null>(null);
    const flushSelectionTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (flushSelectionTimeoutRef.current) {
                clearTimeout(flushSelectionTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        isSyncingFromRemoteRef.current = true;
        lastRenderedItemsRef.current = displayItems;
        const timeout = window.setTimeout(() => {
            isSyncingFromRemoteRef.current = false;
        }, 0);

        return () => {
            clearTimeout(timeout);
        };
    }, [displayItems]);

    const save = (items: (string | User.TModel)[]) => {
        const mergedItems = hiddenCurrentUserAssignee ? [...items, hiddenCurrentUserAssignee] : items;
        updateValue(serializeBoardMemberItems(mergedItems));
        const promise = updateProjectAssignedUsersMutateAsync({
            uid: project.uid,
            emails: mergedItems.flatMap((item) => {
                if (Utils.Type.isString(item)) {
                    return [item];
                }

                return "email" in item && Utils.Type.isString(item.email) ? [item.email] : [];
            }),
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
                return t("successes.Assigned members updated and invited new users successfully.");
            },
        });

        return promise;
    };

    const handleOpenChange = useCallback(
        (open: bool) => {
            setIsPopoverOpen(open);
            if (!open) {
                pendingSerializedSelectionRef.current = null;
                if (flushSelectionTimeoutRef.current) {
                    clearTimeout(flushSelectionTimeoutRef.current);
                    flushSelectionTimeoutRef.current = null;
                }
                updateMeta(null);
            }
        },
        [updateMeta]
    );

    const flushSerializedSelection = useCallback(
        (nextSerializedSelection: string) => {
            pendingSerializedSelectionRef.current = nextSerializedSelection;
            if (flushSelectionTimeoutRef.current) {
                clearTimeout(flushSelectionTimeoutRef.current);
            }

            flushSelectionTimeoutRef.current = window.setTimeout(() => {
                const latestSerializedSelection = pendingSerializedSelectionRef.current;
                pendingSerializedSelectionRef.current = null;
                flushSelectionTimeoutRef.current = null;
                if (latestSerializedSelection === null) {
                    return;
                }

                updateValue(latestSerializedSelection);
            }, 0);
        },
        [updateValue]
    );

    const handleSelectedAssigneesChange = useCallback(
        (items: (string | TUserLikeModel)[]) => {
            const effectiveItems = items;
            lastRenderedItemsRef.current = effectiveItems;
            const effectiveInviteEmails = getInviteEmails(effectiveItems);
            const effectiveVisibleMemberAssignees = effectiveItems.filter((item): item is TUserLikeModel => !Utils.Type.isString(item));
            const nextMemberAssignees = hiddenCurrentUserAssignee
                ? [...effectiveVisibleMemberAssignees, hiddenCurrentUserAssignee]
                : effectiveVisibleMemberAssignees;
            const nextMemberUIDs = nextMemberAssignees.flatMap((item) => (item.uid ? [item.uid] : []));
            const previousMemberUIDs = collaborativeSelectedAssignees.flatMap((item) => (item.uid ? [item.uid] : []));
            const addedMemberUID =
                effectiveInviteEmails.length === collaborativeInviteEmails.length
                    ? (nextMemberUIDs.find((uid) => !previousMemberUIDs.includes(uid)) ?? "")
                    : "";
            const addedInviteEmail = effectiveInviteEmails.find((email) => !collaborativeInviteEmails.includes(email)) ?? "";
            const removedMemberUID = previousMemberUIDs.find((uid) => !nextMemberUIDs.includes(uid)) ?? "";

            if (!isSyncingFromRemoteRef.current && (addedMemberUID || addedInviteEmail || removedMemberUID)) {
                updateMeta({
                    added: !!(addedMemberUID || addedInviteEmail),
                    key: addedMemberUID || addedInviteEmail || removedMemberUID,
                    kind: addedInviteEmail ? "email" : "member",
                    updatedAt: Date.now(),
                } satisfies IBoardMemberSelectionMeta);
            }
            flushSerializedSelection(serializeBoardMemberItems([...nextMemberAssignees, ...effectiveInviteEmails]));
        },
        [collaborativeInviteEmails, flushSerializedSelection, hiddenCurrentUserAssignee, updateMeta]
    );

    return (
        <MultiSelectAssignee.Popover
            onOpenChange={handleOpenChange}
            onSelectedAssigneesChange={handleSelectedAssigneesChange}
            popoverButtonProps={{
                size: "icon",
                className: cn("size-8 xs:size-10", isSelectCardView ? "hidden" : ""),
                title: t("project.Assign members"),
            }}
            popoverContentProps={{
                className: cn(
                    "max-w-[calc(100vw_-_theme(spacing.20))]",
                    "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.60))]",
                    "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.60))]",
                    "min-w-[min(theme(spacing.20),100%)]"
                ),
                align: "start",
            }}
            userAvatarListProps={{
                maxVisible: 6,
                size: { initial: "sm", xs: "default" },
                spacing: "3",
                listAlign: "start",
            }}
            tagContentProps={{
                scope: {
                    projectUID: project.uid,
                },
            }}
            decorateSelectItem={
                ((item: string | TUserLikeModel) => {
                    if (Utils.Type.isString(item)) {
                        const remoteAddedEmailMeta = remoteAddedMetaMaps.emails[item];
                        if (!remoteAddedEmailMeta) {
                            return {};
                        }

                        return {
                            badgeActorName: remoteAddedEmailMeta.actorName,
                            badgeBorderColor: remoteAddedEmailMeta.borderColor,
                        };
                    }

                    const remoteAddedMemberMeta = remoteAddedMetaMaps.members[item.uid];
                    if (!remoteAddedMemberMeta) {
                        return {};
                    }

                    return {
                        badgeActorName: remoteAddedMemberMeta.actorName,
                        badgeBorderColor: remoteAddedMemberMeta.borderColor,
                    };
                }) as IFormProps["decorateSelectItem"]
            }
            addIconSize="6"
            allSelectables={allSelectables}
            showableAssignees={showableAssignees}
            selectedAssignees={displayItems}
            originalAssignees={selectedAssignees}
            createSearchKeywords={(item: string | TUserLikeModel) => {
                if (Utils.Type.isString(item)) {
                    return [item];
                }

                if (item.MODEL_NAME === BotModel.Model.MODEL_NAME) {
                    return [];
                }

                item = item as User.TModel;
                if (item.isValidUser()) {
                    return [item.email, item.firstname, item.lastname];
                } else {
                    return [item.email, t("project.invited")];
                }
            }}
            createLabel={(item: string | TUserLikeModel) => {
                if (Utils.Type.isString(item)) {
                    return item;
                }

                if (item.MODEL_NAME === BotModel.Model.MODEL_NAME) {
                    item = item as BotModel.TModel;
                    return `${item.name} (${item.bot_uname})`;
                }

                item = item as User.TModel;
                const isInvited = item.isPresentableUnknownUser() || invitedMemberUIDs.includes(item.uid);
                const invitedText = isInvited ? ` (${t("project.invited")})` : "";
                if (item.isValidUser()) {
                    return `${item.firstname} ${item.lastname}${invitedText}`.trim();
                } else {
                    return `${item.email} ${invitedText}`;
                }
            }}
            placeholder={t("myAccount.Add an email...")}
            canAddNew
            validateNewItem={(value) => !!value && EMAIL_REGEX.test(value)}
            save={save as TSaveHandler}
            withUserGroups
            groups={groups}
            canEdit={canEdit || ownerUID === currentUser.uid}
        />
    );
});
BoardMemberList.displayName = "Board.MemberList";

export default BoardMemberList;
