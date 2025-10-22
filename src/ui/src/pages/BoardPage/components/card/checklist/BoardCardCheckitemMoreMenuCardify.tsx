import { Floating, Select, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import useCardifyCardCheckitem from "@/controllers/api/card/checkitem/useCardifyCardCheckitem";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectColumn } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardCheckitemMoreMenuCardify(): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { model: checkitem } = ModelRegistry.ProjectCheckitem.useContext();
    const [t] = useTranslation();
    const { isValidating } = useMoreMenu();
    const { mutateAsync: cardifyCheckitemMutateAsync } = useCardifyCardCheckitem({ interceptToast: true });
    const allColumns = ProjectColumn.Model.useModels((model) => model.project_uid === projectUID && !model.is_archive);
    const [selectedColumnUID, setSelectedColumnUID] = useState<string | undefined>(
        allColumns.some((column) => column.uid === card.project_column_uid) ? card.project_column_uid : allColumns[0]?.uid
    );

    const onOpenChange = (opened: bool) => {
        if (!opened) {
            setSelectedColumnUID(!card.archived_at ? card.project_column_uid : allColumns[0]?.uid);
        }
    };

    const cardify = (endCallback: (shouldClose: bool) => void) => {
        const promise = cardifyCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
            project_column_uid: selectedColumnUID,
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
                return t("successes.Cardified the checkitem successfully.");
            },
            finally: () => {
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.PopoverItem
            modal
            menuName={t("card.Cardify")}
            contentProps={{ className: sharedClassNames.popoverContent }}
            saveText={t("card.Cardify")}
            onSave={cardify}
            onOpenChange={onOpenChange}
        >
            {allColumns.length > 0 && (
                <Floating.LabelSelect
                    label={t("card.Select column")}
                    value={selectedColumnUID}
                    onValueChange={setSelectedColumnUID}
                    disabled={isValidating}
                    options={allColumns.map((column) => (
                        <Select.Item value={column.uid} key={`board-card-checkitem-column-${column.uid}`}>
                            {column.name}
                        </Select.Item>
                    ))}
                />
            )}
        </MoreMenu.PopoverItem>
    );
}

export default BoardCardCheckitemMoreMenuCardify;
