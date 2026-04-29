import MultiSelectAssignee, { IFormProps, TSaveHandler } from "@/components/MultiSelectAssignee";
import { useCollaborativeText } from "@/components/Collaborative/useCollaborativeText";
import Toast from "@/components/base/Toast";
import useUpdateCardAssignedUsers from "@/controllers/api/card/useUpdateCardAssignedUsers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { User } from "@/core/models";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { getUserUIDs, parseCollaborativeStringList } from "@/core/utils/CollaborativeSelectionUtils";
import { cn } from "@/core/utils/ComponentUtils";
import { EEditorCollaborationType } from "@langboard/core/constants";
import { Utils } from "@langboard/core/utils";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface IMemberSelectionMeta {
    added: bool;
    memberUID: string;
    updatedAt: number;
}

interface IRemoteMemberMetaState {
    actorName: string;
    borderColor: string;
    updatedAt: number;
}

const BoardCardMemberList = memo(() => {
    const { projectUID, card, currentUser, hasRoleAction, isCardEditing } = useBoardCard();
    const [t] = useTranslation();
    const canEdit = hasRoleAction(ProjectRole.EAction.CardUpdate) && isCardEditing;
    const projectMembers = card.useForeignFieldArray("project_members");
    const cardMemberUIDs = card.useField("member_uids");
    const cardMembers = useMemo(() => projectMembers.filter((member) => cardMemberUIDs.includes(member.uid)), [projectMembers, cardMemberUIDs]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const groups = currentUser.useForeignFieldArray("user_groups");
    const { mutateAsync: updateCardAssignedUsersMutateAsync } = useUpdateCardAssignedUsers({ interceptToast: true });
    const defaultSelectedMemberUIDs = JSON.stringify(cardMemberUIDs);
    const { remoteMeta, updateMeta, updateValue, value } = useCollaborativeText({
        defaultValue: defaultSelectedMemberUIDs,
        disabled: !isPopoverOpen,
        collaborationType: EEditorCollaborationType.Card,
        uid: card.uid,
        section: "members",
        field: "selected-member-uids",
    });
    const selectedMemberUIDs = parseCollaborativeStringList(value, cardMemberUIDs);
    const selectedAssignees = useMemo(
        () =>
            selectedMemberUIDs.map((uid) => projectMembers.find((member) => member.uid === uid)).filter((member): member is User.TModel => !!member),
        [projectMembers, selectedMemberUIDs]
    );
    const remoteMemberMetaMap = useMemo(() => {
        return remoteMeta.reduce<Record<string, IRemoteMemberMetaState & { added: bool }>>((acc, meta) => {
            const value = meta.value;
            if (
                !value ||
                !Utils.Type.isObject(value) ||
                !Utils.Type.isString((value as Record<string, unknown>).memberUID) ||
                !Utils.Type.isBool((value as Record<string, unknown>).added) ||
                !Utils.Type.isNumber((value as Record<string, unknown>).updatedAt)
            ) {
                return acc;
            }

            const parsedValue = value as IMemberSelectionMeta;
            const previous = acc[parsedValue.memberUID];
            if (!previous || previous.updatedAt < parsedValue.updatedAt) {
                acc[parsedValue.memberUID] = {
                    added: parsedValue.added,
                    actorName: meta.name,
                    borderColor: meta.color,
                    updatedAt: parsedValue.updatedAt,
                };
            }

            return acc;
        }, {});
    }, [remoteMeta]);
    const pendingSelectedMemberUIDsRef = useRef<string[] | null>(null);
    const flushSelectedMemberUIDsTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (flushSelectedMemberUIDsTimeoutRef.current) {
                clearTimeout(flushSelectedMemberUIDsTimeoutRef.current);
            }
        };
    }, []);

    const onSave = async (items: User.TModel[]) => {
        const promise = updateCardAssignedUsersMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            assigned_users: getUserUIDs(items),
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
                return t("successes.Assigned members updated successfully.");
            },
        });
    };

    const handleOpenChange = useCallback(
        (open: bool) => {
            setIsPopoverOpen(open);
            if (!open) {
                pendingSelectedMemberUIDsRef.current = null;
                if (flushSelectedMemberUIDsTimeoutRef.current) {
                    clearTimeout(flushSelectedMemberUIDsTimeoutRef.current);
                    flushSelectedMemberUIDsTimeoutRef.current = null;
                }
                updateMeta(null);
                updateValue(defaultSelectedMemberUIDs);
            }
        },
        [defaultSelectedMemberUIDs, updateMeta, updateValue]
    );

    const flushSelectedMemberUIDs = useCallback(
        (nextSelectedMemberUIDs: string[]) => {
            pendingSelectedMemberUIDsRef.current = nextSelectedMemberUIDs;
            if (flushSelectedMemberUIDsTimeoutRef.current) {
                clearTimeout(flushSelectedMemberUIDsTimeoutRef.current);
            }

            flushSelectedMemberUIDsTimeoutRef.current = window.setTimeout(() => {
                const latestSelectedMemberUIDs = pendingSelectedMemberUIDsRef.current;
                pendingSelectedMemberUIDsRef.current = null;
                flushSelectedMemberUIDsTimeoutRef.current = null;
                if (!latestSelectedMemberUIDs) {
                    return;
                }

                updateValue(JSON.stringify(latestSelectedMemberUIDs));
            }, 0);
        },
        [updateValue]
    );

    const handleSelectedAssigneesChange = useCallback(
        (items: (string | TUserLikeModel)[]) => {
            const nextSelectedMemberUIDs = getUserUIDs(items);
            const addedMemberUID = nextSelectedMemberUIDs.find((uid) => !selectedMemberUIDs.includes(uid)) ?? "";
            const removedMemberUID = selectedMemberUIDs.find((uid) => !nextSelectedMemberUIDs.includes(uid)) ?? "";

            updateMeta(
                addedMemberUID || removedMemberUID
                    ? ({
                          added: !!addedMemberUID,
                          memberUID: addedMemberUID || removedMemberUID,
                          updatedAt: Date.now(),
                      } satisfies IMemberSelectionMeta)
                    : null
            );
            flushSelectedMemberUIDs(nextSelectedMemberUIDs);
        },
        [flushSelectedMemberUIDs, selectedMemberUIDs, updateMeta]
    );

    return (
        <MultiSelectAssignee.Popover
            onOpenChange={handleOpenChange}
            onSelectedAssigneesChange={handleSelectedAssigneesChange}
            popoverButtonProps={{
                size: "icon",
                className: "size-8 lg:size-10",
                title: t("card.Assign members"),
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
                size: { initial: "sm", lg: "default" },
                spacing: "none",
                listAlign: "start",
                className: "space-x-1",
            }}
            addIconSize={{ initial: "4", lg: "6" }}
            canEdit={canEdit}
            save={onSave as TSaveHandler}
            allSelectables={projectMembers}
            selectedAssignees={selectedAssignees}
            tagContentProps={{
                scope: {
                    projectUID,
                    cardUID: card.uid,
                },
            }}
            originalAssignees={cardMembers}
            createSearchKeywords={((item: User.TModel) => [item.email, item.firstname, item.lastname]) as IFormProps["createSearchKeywords"]}
            createLabel={((item: User.TModel) => `${item.firstname} ${item.lastname}`.trim()) as IFormProps["createLabel"]}
            decorateSelectItem={
                ((item: User.TModel) => {
                    const remoteMemberMeta = remoteMemberMetaMap[item.uid];
                    if (!remoteMemberMeta || !remoteMemberMeta.added) {
                        return {};
                    }

                    return {
                        badgeActorName: remoteMemberMeta.actorName,
                        badgeBorderColor: remoteMemberMeta.borderColor,
                    };
                }) as IFormProps["decorateSelectItem"]
            }
            renderSelectableItem={
                ((item: User.TModel) => {
                    const remoteMemberMeta = remoteMemberMetaMap[item.uid];
                    const label = `${item.firstname} ${item.lastname}`.trim();

                    if (!remoteMemberMeta || remoteMemberMeta.added) {
                        return label;
                    }

                    return (
                        <div className="relative w-full rounded-md border-2 px-2 py-1" style={{ borderColor: remoteMemberMeta.borderColor }}>
                            <div
                                className="pointer-events-none absolute -top-3 left-2 bg-popover px-1 text-[10px] font-medium leading-none"
                                style={{ color: remoteMemberMeta.borderColor }}
                            >
                                {remoteMemberMeta.actorName}
                            </div>
                            <span>{label}</span>
                        </div>
                    );
                }) as IFormProps["renderSelectableItem"]
            }
            placeholder={t("card.Select members...")}
            withUserGroups
            groups={groups}
            filterGroupUser={(item: User.TModel) => item.isValidUser() && projectMembers.some((member) => member.uid === item.uid)}
        />
    );
});

export default BoardCardMemberList;
