import { Box, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import useDeleteProjectLabel from "@/controllers/api/board/settings/useDeleteProjectLabel";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { useTranslation } from "react-i18next";

function BoardSettingsLabelMoreMenuDelete(): React.JSX.Element {
    const { project } = useBoardSettings();
    const { model: label } = ModelRegistry.ProjectLabel.useContext();
    const [t] = useTranslation();
    const { mutateAsync: deleteProjectLabelMutateAsync } = useDeleteProjectLabel({ interceptToast: true });

    const deleteLabel = (endCallback: (shouldClose: bool) => void) => {
        const promise = deleteProjectLabelMutateAsync({
            project_uid: project.uid,
            label_uid: label.uid,
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
                return t("successes.Label deleted successfully.");
            },
            finally: () => {
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.PopoverItem
            modal
            menuName={t("common.Delete")}
            saveText={t("common.Delete")}
            saveButtonProps={{ variant: "destructive" }}
            onSave={deleteLabel}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold">
                {t("ask.Are you sure you want to delete this label?")}
            </Box>
            <Box textSize="sm" weight="bold" className="text-center text-red-500">
                {t("common.deleteDescriptions.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
}

export default BoardSettingsLabelMoreMenuDelete;
