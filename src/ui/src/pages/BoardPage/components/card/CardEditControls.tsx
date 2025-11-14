import { Button, Flex, IconComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { useTranslation } from "react-i18next";

export interface ICardEditControlsProps {
    className?: string;
    isEditing: boolean;
    onSave: () => void;
    onCancel: () => void;
    saveDisabled?: boolean;
}

export const CardEditControls = ({ className, isEditing, onSave, onCancel, saveDisabled = false }: ICardEditControlsProps): JSX.Element => {
    const [t] = useTranslation();

    if (!isEditing) {
        return null;
    }

    return (
        <Flex className={cn("gap-2 px-4 py-2", "transition-all duration-200 ease-in-out", className)} justify="end" items="center">
            <Flex className="gap-2">
                <Button variant="outline" size="sm" onClick={onCancel} className="gap-1">
                    <IconComponent icon="x" size="4" />
                    {t("common.Cancel")}
                </Button>

                <Button variant="default" size="sm" onClick={onSave} disabled={saveDisabled} className="gap-1">
                    <IconComponent icon="save" size="4" />
                    {t("common.Save")}
                </Button>
            </Flex>
        </Flex>
    );
};

export default CardEditControls;
