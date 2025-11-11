import MultiSelectAssignee, { IFormProps, TSaveHandler } from "@/components/MultiSelectAssignee";
import { Toast } from "@/components/base";
import useUpdateCardAssignedUsers from "@/controllers/api/card/useUpdateCardAssignedUsers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, User } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

const BoardCardMemberList = memo(() => {
    const { projectUID, card, currentUser, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const canEdit = hasRoleAction(Project.ERoleAction.CardUpdate);
    const projectMembers = card.useForeignFieldArray("project_members");
    const cardMemberUIDs = card.useField("member_uids");
    const cardMembers = useMemo(() => projectMembers.filter((member) => cardMemberUIDs.includes(member.uid)), [projectMembers, cardMemberUIDs]);
    const groups = currentUser.useForeignFieldArray("user_groups");
    const { mutateAsync: updateCardAssignedUsersMutateAsync } = useUpdateCardAssignedUsers({ interceptToast: true });

    const onSave = async (items: User.TModel[]) => {
        const promise = updateCardAssignedUsersMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            assigned_users: User.filterValidUserUIDs(items),
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

    return (
        <MultiSelectAssignee.Popover
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
            tagContentProps={{
                scope: {
                    projectUID,
                    cardUID: card.uid,
                },
            }}
            originalAssignees={cardMembers}
            createSearchKeywords={((item: User.TModel) => [item.email, item.firstname, item.lastname]) as IFormProps["createSearchKeywords"]}
            createLabel={((item: User.TModel) => `${item.firstname} ${item.lastname}`.trim()) as IFormProps["createLabel"]}
            placeholder={t("card.Select members...")}
            withUserGroups
            groups={groups}
            filterGroupUser={(item: User.TModel) => item.isValidUser() && projectMembers.some((member) => member.uid === item.uid)}
        />
    );
});

export default BoardCardMemberList;
