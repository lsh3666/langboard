import { Skeleton } from "@/components/base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";

export function SkeletonBoardCardColumnName() {
    return <Skeleton h="5" className="w-1/6" />;
}

function BoardCardColumnName(): JSX.Element {
    const { card } = useBoardCard();
    const columnName = card.useField("project_column_name");

    return <>{columnName}</>;
}

export default BoardCardColumnName;
