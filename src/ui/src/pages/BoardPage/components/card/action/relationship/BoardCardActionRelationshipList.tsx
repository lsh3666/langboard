import Flex from "@/components/base/Flex";
import ScrollArea from "@/components/base/ScrollArea";
import { ProjectCardRelationship } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useBoardController } from "@/core/providers/BoardController";
import { Utils } from "@langboard/core/utils";
import BoardCardActionRelationshipItem from "@/pages/BoardPage/components/card/action/relationship/BoardCardActionRelationshipItem";
import { memo, useEffect, useState } from "react";

export interface IBoardCardActionRelationshipListProps {
    type: ProjectCardRelationship.TRelationship;
    relationships: ProjectCardRelationship.TModel[];
}

const BoardCardActionRelationshipList = memo(({ type, relationships: flatRelationships }: IBoardCardActionRelationshipListProps) => {
    const isParent = type === "parents";
    const { card } = useBoardCard();
    const { filterRelationships } = useBoardController();
    const [relationships, setRelationships] = useState(filterRelationships(card.uid, flatRelationships, isParent));

    useEffect(() => {
        setRelationships(() => filterRelationships(card.uid, flatRelationships, isParent));
    }, [flatRelationships]);

    return (
        <ScrollArea.Root className="border">
            <Flex direction="col" position="relative" textSize="sm" className="h-[min(theme(spacing.48),35vh)] select-none">
                {relationships.map((relationship) => (
                    <BoardCardActionRelationshipItem key={Utils.String.Token.shortUUID()} type={type} relationship={relationship} />
                ))}
            </Flex>
        </ScrollArea.Root>
    );
});

export default BoardCardActionRelationshipList;
