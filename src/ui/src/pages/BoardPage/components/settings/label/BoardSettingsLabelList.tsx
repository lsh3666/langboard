import { Flex } from "@/components/base";
import useChangeProjectLabelOrder from "@/controllers/api/board/settings/useChangeProjectLabelOrder";
import { singleDndHelpers } from "@/core/helpers/dnd";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnReordered from "@/core/hooks/useColumnReordered";
import { ProjectLabel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsLabel from "@/pages/BoardPage/components/settings/label/BoardSettingsLabel";
import BoardSettingsLabelAddButton from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelAddButton";
import { BOARD_SETTINGS_LABEL_DND_SYMBOL_SET } from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelConstants";
import { memo, useEffect, useMemo, useReducer } from "react";

const BoardSettingsLabelList = memo(() => {
    const { project, socket } = useBoardSettings();
    const { mutate: changeProjectLabelOrderMutate } = useChangeProjectLabelOrder();
    const updater = useReducer((x) => x + 1, 0);
    const flatLabels = project.useForeignFieldArray("labels");
    const labelsMap = useMemo<Record<string, ProjectLabel.TModel>>(() => {
        const map: Record<string, ProjectLabel.TModel> = {};
        flatLabels.forEach((label) => {
            map[label.uid] = label;
        });
        return map;
    }, [flatLabels]);
    const { columns: labels } = useColumnReordered({
        type: "ProjectLabel",
        topicId: project.uid,
        eventNameParams: { uid: project.uid },
        columns: flatLabels,
        socket,
        updater,
    });

    useEffect(() => {
        const setupApiErrors = (error: unknown, undo: () => void) => {
            const { handle } = setupApiErrorHandler({
                code: {
                    after: undo,
                },
                wildcard: {
                    after: undo,
                },
            });

            handle(error);
        };

        return singleDndHelpers.root({
            rowsMap: labelsMap,
            symbolSet: BOARD_SETTINGS_LABEL_DND_SYMBOL_SET,
            changeOrder: ({ rowUID, order, undo }) => {
                changeProjectLabelOrderMutate(
                    { project_uid: project.uid, label_uid: rowUID, order },
                    {
                        onError: (error) => setupApiErrors(error, undo),
                    }
                );
            },
        });
    }, [flatLabels, labelsMap]);

    return (
        <>
            <Flex direction="col" gap="2" py="4">
                {labels.map((label) => (
                    <BoardSettingsLabel key={`board-setting-label-${label.uid}`} label={label} />
                ))}
            </Flex>
            <BoardSettingsLabelAddButton />
        </>
    );
});

export default BoardSettingsLabelList;
