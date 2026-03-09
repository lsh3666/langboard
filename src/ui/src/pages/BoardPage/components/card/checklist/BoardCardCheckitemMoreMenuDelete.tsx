import Box from "@/components/base/Box";
import Toast from "@/components/base/Toast";
import MoreMenu from "@/components/MoreMenu";
import useDeleteCardCheckitem from "@/controllers/api/card/checkitem/useDeleteCardCheckitem";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardCheckitemMoreDelete(): React.JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { model: checkitem } = ModelRegistry.ProjectCheckitem.useContext();
    const [t] = useTranslation();
    const { mutateAsync: deleteCheckitemMutateAsync } = useDeleteCardCheckitem({ interceptToast: true });

    const deleteCheckitem = (endCallback: (shouldClose: bool) => void) => {
        const promise = deleteCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
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
                return t("successes.Checkitem deleted successfully.");
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
            onSave={deleteCheckitem}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                {t("ask.Are you sure you want to delete this checkitem?")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("common.deleteDescriptions.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
}

export default BoardCardCheckitemMoreDelete;
