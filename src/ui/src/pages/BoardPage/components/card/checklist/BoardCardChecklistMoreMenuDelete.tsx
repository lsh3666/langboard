import Box from "@/components/base/Box";
import Toast from "@/components/base/Toast";
import MoreMenu from "@/components/MoreMenu";
import useDeleteCardChecklist from "@/controllers/api/card/checklist/useDeleteCardChecklist";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardChecklistMoreMenuDelete(): React.JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { model: checklist } = ModelRegistry.ProjectChecklist.useContext();
    const [t] = useTranslation();
    const { mutateAsync: deleteChecklistMutateAsync } = useDeleteCardChecklist({ interceptToast: true });

    const deleteChecklist = (endCallback: (shouldClose: bool) => void) => {
        const promise = deleteChecklistMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checklist_uid: checklist.uid,
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
                return t("successes.Checklist deleted successfully.");
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
            contentProps={{ className: sharedClassNames.popoverContent }}
            saveText={t("common.Delete")}
            saveButtonProps={{ variant: "destructive" }}
            onSave={deleteChecklist}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                {t("ask.Are you sure you want to delete this checklist?")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("card.All checkitems in this group will be deleted as well.")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("common.deleteDescriptions.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
}

export default BoardCardChecklistMoreMenuDelete;
