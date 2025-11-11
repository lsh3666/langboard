import { Box, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import NotificationSetting from "@/components/NotificationSetting";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useDeleteProjectColumn from "@/controllers/api/board/useDeleteProjectColumn";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, ProjectColumn } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import BoardColumnMoreMenuBotList from "@/pages/BoardPage/components/board/BoardColumnMoreMenuBotList";
import BoardColumnMoreMenuBotScope from "@/pages/BoardPage/components/board/BoardColumnMoreMenuBotScope";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardColumnMoreMenuProps {
    column: ProjectColumn.TModel;
}

const BoardColumnMoreMenu = memo(({ column }: IBoardColumnMoreMenuProps) => {
    const { project, currentUser, hasRoleAction } = useBoard();
    const canEdit = hasRoleAction(Project.ERoleAction.Update);

    return (
        <MoreMenu.Root
            triggerProps={{ className: "size-7", ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
            contentProps={{ className: "w-min p-0", ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
        >
            <NotificationSetting.SpecificScopedPopover
                type="column"
                currentUser={currentUser}
                specificUID={column.uid}
                modal
                form={{
                    project_uid: project.uid,
                    project_column_uid: column.uid,
                }}
                triggerProps={{
                    variant: "ghost",
                    className: "w-full justify-start rounded-none px-2 py-1.5 font-normal",
                    role: "menuitem",
                }}
                iconProps={{
                    className: "hidden",
                }}
                showTriggerText
                onlyPopover
            />
            {canEdit && <BoardColumnMoreMenuBotScope column={column} />}
            {canEdit && !column.is_archive && <BoardColumnMoreMenuDelete column={column} />}
            {canEdit && <BoardColumnMoreMenuBotList column={column} />}
        </MoreMenu.Root>
    );
});
BoardColumnMoreMenu.displayName = "Board.ColumnMore";

const BoardColumnMoreMenuDelete = memo(({ column }: IBoardColumnMoreMenuProps) => {
    const [t] = useTranslation();
    const { project } = useBoard();
    const { mutateAsync } = useDeleteProjectColumn({ interceptToast: true });

    const deleteColumn = (endCallback: (shouldClose: bool) => void) => {
        const promise = mutateAsync({
            project_uid: project.uid,
            project_column_uid: column.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Column deleted successfully.");
            },
            finally: () => {
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.PopoverItem
            modal
            contentProps={{ align: "center", ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
            menuName={t("project.Delete column")}
            saveText={t("common.Delete")}
            saveButtonProps={{ variant: "destructive" }}
            onSave={deleteColumn}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                {t("ask.Are you sure you want to delete this column?")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("project.All cards in this column will be archived.")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("common.deleteDescriptions.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
});
BoardColumnMoreMenuDelete.displayName = "Board.ColumnMoreDelete";

export default BoardColumnMoreMenu;
