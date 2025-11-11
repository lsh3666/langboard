import { Flex } from "@/components/base";
import { LabelModelBadge } from "@/components/LabelBadge";
import { ProjectLabel } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";

function BoardCardLabelList(): JSX.Element {
    const { card } = useBoardCard();
    const labels = card.useForeignFieldArray("labels");
    ProjectLabel.Model.subscribe("DELETION", `board-card-label-list-${card.uid}`, (uids) => {
        const newLabels = labels.filter((label) => !uids.includes(label.uid));
        card.labels = newLabels;
    });

    return (
        <Flex inline wrap gap="1.5">
            {labels.map((label) => (
                <LabelModelBadge key={`board-card-label-${label.uid}`} model={label} />
            ))}
        </Flex>
    );
}

export default BoardCardLabelList;
