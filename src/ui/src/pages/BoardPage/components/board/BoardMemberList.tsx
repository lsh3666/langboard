import MultiSelectAssignee, { TSaveHandler } from "@/components/MultiSelectAssignee";
import { Toast } from "@/components/base";
import { EMAIL_REGEX } from "@/constants";
import useUpdateProjectAssignedUsers from "@/controllers/api/board/useUpdateProjectAssignedUsers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel, Project, User } from "@/core/models";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardMemberListProps {
    isSelectCardView: bool;
}

const BoardMemberList = memo(({ isSelectCardView }: IBoardMemberListProps) => {
    const [t] = useTranslation();
    const { project, currentUser, hasRoleAction } = useBoard();
    const canEdit = hasRoleAction(Project.ERoleAction.Update);
    const ownerUID = project.useField("owner_uid");
    const allMemebers = project.useForeignFieldArray("all_members");
    const invitedMemberUIDs = project.useField("invited_member_uids");
    const groups = currentUser.useForeignFieldArray("user_groups");
    const allSelectables = useMemo(
        () => allMemebers.filter((model) => model.uid !== ownerUID && model.uid !== currentUser.uid),
        [allMemebers, invitedMemberUIDs]
    );
    const showableAssignees = useMemo(
        () => [...allMemebers.filter((model) => model.isValidUser() && !invitedMemberUIDs.includes(model.uid))].slice(0, 6),
        [allMemebers, invitedMemberUIDs]
    );
    const selectedAssignees = useMemo(
        () => allMemebers.filter((model) => model.uid !== ownerUID && model.uid !== currentUser.uid),
        [allMemebers, invitedMemberUIDs]
    );
    const { mutateAsync: updateProjectAssignedUsersMutateAsync } = useUpdateProjectAssignedUsers({ interceptToast: true });

    const save = (items: (string | User.TModel)[]) => {
        const promise = updateProjectAssignedUsersMutateAsync({
            uid: project.uid,
            emails: items.map((item) => (Utils.Type.isString(item) ? item : item.email)),
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
    };

    return (
        <MultiSelectAssignee.Popover
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
            addIconSize="6"
            allSelectables={allSelectables}
            showableAssignees={showableAssignees}
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
