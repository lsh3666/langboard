import Checkbox from "@/components/base/Checkbox";
import Toast from "@/components/base/Toast";
import useToggleCardChecklistChecked from "@/controllers/api/card/checklist/useToggleCardChecklistChecked";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { IBoardCardCheckRelatedContextParams } from "@/pages/BoardPage/components/card/checklist/types";
import { useTranslation } from "react-i18next";

function BoardCardChecklistCheckbox() {
    const { projectUID, card } = useBoardCard();
    const { model: checklist, params } = ModelRegistry.ProjectChecklist.useContext<IBoardCardCheckRelatedContextParams>();
    const { isValidating, setIsValidating } = params;
    const [t] = useTranslation();
    const isChecked = checklist.useField("is_checked");
    const { mutateAsync: toggleChecklistMutateAsync } = useToggleCardChecklistChecked({ interceptToast: true });

    const toggleChecked = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = toggleChecklistMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checklist_uid: checklist.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Toggled checklist successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return <Checkbox checked={isChecked} onClick={toggleChecked} disabled={isValidating} />;
}

export default BoardCardChecklistCheckbox;
