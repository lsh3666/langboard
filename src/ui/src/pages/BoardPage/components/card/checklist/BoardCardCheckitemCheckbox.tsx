import Checkbox from "@/components/base/Checkbox";
import Toast from "@/components/base/Toast";
import useToggleCardCheckitemChecked from "@/controllers/api/card/checkitem/useToggleCardCheckitemChecked";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { IBoardCardCheckRelatedContextParams } from "@/pages/BoardPage/components/card/checklist/types";
import { useTranslation } from "react-i18next";

function BoardCardCheckitemCheckbox() {
    const { projectUID, card } = useBoardCard();
    const { model: checkitem, params } = ModelRegistry.ProjectCheckitem.useContext<IBoardCardCheckRelatedContextParams>();
    const { canEdit: canEditCheckitem, isValidating, setIsValidating } = params;
    const [t] = useTranslation();
    const isChecked = checkitem.useField("is_checked");
    const { mutateAsync: toggleCheckitemMutateAsync } = useToggleCardCheckitemChecked({ interceptToast: true });

    const toggleChecked = () => {
        if (isValidating || !canEditCheckitem) {
            return;
        }

        setIsValidating(true);

        const promise = toggleCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
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
                return t("successes.Toggled checkitem successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return <Checkbox checked={isChecked} onClick={toggleChecked} disabled={isValidating || !canEditCheckitem} />;
}

export default BoardCardCheckitemCheckbox;
