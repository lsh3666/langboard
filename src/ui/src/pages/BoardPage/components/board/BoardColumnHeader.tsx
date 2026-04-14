import Card from "@/components/base/Card";
import { ProjectColumn } from "@/core/models";
import BoardColumnMoreMenu from "@/pages/BoardPage/components/board/BoardColumnMoreMenu";
import BoardColumnName from "@/pages/BoardPage/components/board/BoardColumnName";
import { memo, useCallback, useState } from "react";

export interface IBoardColumnHeaderProps {
    isDragging: bool;
    column: ProjectColumn.TModel;
    headerProps: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
}

const BoardColumnHeader = memo(({ isDragging, column, headerProps }: IBoardColumnHeaderProps) => {
    const [renameTrigger, setRenameTrigger] = useState(0);
    const handleRenameStart = useCallback(() => {
        setRenameTrigger((prev) => prev + 1);
    }, []);

    return (
        <Card.Header className="flex flex-row items-start justify-between space-y-0 pb-1 pr-3 pt-4 text-left font-semibold" {...headerProps}>
            <BoardColumnName isDragging={isDragging} column={column} renameTrigger={renameTrigger} />
            <BoardColumnMoreMenu column={column} onRenameStart={handleRenameStart} />
        </Card.Header>
    );
});
BoardColumnHeader.displayName = "Board.ColumnHeader";

export default BoardColumnHeader;
