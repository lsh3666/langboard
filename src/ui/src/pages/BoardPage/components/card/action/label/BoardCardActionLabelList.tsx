import Checkbox from "@/components/base/Checkbox";
import Flex from "@/components/base/Flex";
import Label from "@/components/base/Label";
import ScrollArea from "@/components/base/ScrollArea";
import { ProjectLabel } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardActionLabel from "@/pages/BoardPage/components/card/action/label/BoardCardActionLabel";
import { memo } from "react";

export interface IBoardCardActionLabelListProps {
    selectedLabelUIDs: string[];
    setSelectedLabelUIDs: React.Dispatch<React.SetStateAction<string[]>>;
}

const BoardCardActionLabelList = memo(({ selectedLabelUIDs, setSelectedLabelUIDs }: IBoardCardActionLabelListProps) => {
    const { card } = useBoardCard();
    const flatProjectLabels = ProjectLabel.Model.useModels((model) => model.project_uid === card.project_uid);
    const projectLabels = flatProjectLabels.sort((a, b) => a.order - b.order);
    ProjectLabel.Model.subscribe("DELETION", `board-card-action-label-list-${card.uid}`, (uids) => {
        setSelectedLabelUIDs((prev) => prev.filter((uid) => !uids.includes(uid)));
    });

    const changeSelectedState = (labelUID: string) => {
        if (selectedLabelUIDs.includes(labelUID)) {
            setSelectedLabelUIDs((prev) => prev.filter((uid) => uid !== labelUID));
        } else {
            setSelectedLabelUIDs((prev) => [...prev, labelUID]);
        }
    };

    return (
        <ScrollArea.Root className="border border-dashed">
            <Flex direction="col" position="relative" className="h-[min(theme(spacing.48),35vh)] select-none">
                {projectLabels.map((label) => (
                    <Label
                        key={`board-card-action-label-${label.uid}`}
                        display="flex"
                        items="center"
                        gap="3"
                        p="2"
                        cursor="pointer"
                        className="hover:bg-secondary/40"
                    >
                        <Checkbox checked={selectedLabelUIDs.includes(label.uid)} onCheckedChange={() => changeSelectedState(label.uid)} />
                        <BoardCardActionLabel label={label} />
                    </Label>
                ))}
            </Flex>
        </ScrollArea.Root>
    );
});

export default BoardCardActionLabelList;
