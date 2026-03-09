import ColorPicker from "@/components/base/ColorPicker";
import Toast from "@/components/base/Toast";
import useChangeProjectLabelDetails from "@/controllers/api/board/settings/useChangeProjectLabelDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { IBoardSettingsLabelContextParams } from "@/pages/BoardPage/components/settings/label/types";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const BoardSettingsLabelColor = memo(() => {
    const { project } = useBoardSettings();
    const { model: label, params } = ModelRegistry.ProjectLabel.useContext<IBoardSettingsLabelContextParams>();
    const { isValidating, setIsValidating } = params;
    const [t] = useTranslation();
    const labelColor = label.useField("color");
    const { mutateAsync: changeProjectLabelDetailsMutateAsync } = useChangeProjectLabelDetails("color", { interceptToast: true });

    const changeColor = (color: string, endCallback: () => void) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        if (!color) {
            Toast.Add.error(t("project.settings.errors.Color cannot be empty."));
            setIsValidating(false);
            return;
        }

        const promise = changeProjectLabelDetailsMutateAsync({
            project_uid: project.uid,
            label_uid: label.uid,
            color,
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
                return t("successes.Color changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                endCallback();
            },
        });
    };

    return (
        <ColorPicker
            size="icon"
            value={labelColor}
            isValidating={isValidating}
            onSave={changeColor}
            popoverContentAlign="start"
            className="min-h-9 min-w-9 transition-all hover:opacity-80"
        />
    );
});

export default BoardSettingsLabelColor;
