import { Box, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import useDeleteCardAttachment from "@/controllers/api/card/attachment/useDeleteCardAttachment";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardAttachmentMoreMenuDelete(): React.JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { model: attachment } = ModelRegistry.ProjectCardAttachment.useContext();
    const [t] = useTranslation();
    const { mutateAsync: deleteCardAttachmentMutateAsync } = useDeleteCardAttachment({ interceptToast: true });

    const deleteAttachment = (endCallback: (shouldClose: bool) => void) => {
        const promise = deleteCardAttachmentMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            attachment_uid: attachment.uid,
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
                return t("successes.File deleted successfully.");
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
            contentProps={{ className: sharedClassNames.popoverContent }}
            saveButtonProps={{ variant: "destructive" }}
            onSave={deleteAttachment}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold">
                {t("ask.Are you sure you want to delete this file?")}
            </Box>
            <Box textSize="sm" weight="bold" className="text-center text-red-500">
                {t("common.deleteDescriptions.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
}

export default BoardCardAttachmentMoreMenuDelete;
