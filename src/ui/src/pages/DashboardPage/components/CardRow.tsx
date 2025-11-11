import { Button, Table } from "@/components/base";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { ProjectCard } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import { add as addDate, differenceInSeconds, intervalToDuration } from "date-fns";
import { useMemo } from "react";

export interface ICardRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    card: ProjectCard.TModel;
}

function CardRow({ card, ...props }: ICardRowProps): JSX.Element | null {
    const navigate = usePageNavigateRef();
    const title = card.useField("title");
    const columnName = card.useField("project_column_name");
    const archivedAt = card.useField("archived_at");
    const rawCreatedAt = card.useField("created_at");
    const createdAt = useUpdateDateDistance(rawCreatedAt);

    return (
        <Table.FlexRow
            {...props}
            className={cn(
                !!archivedAt &&
                    cn(
                        "text-muted-foreground [&_button]:text-primary/70",
                        "after:absolute after:left-0 after:top-1/2 after:z-50 after:-translate-y-1/2",
                        "after:h-px after:w-full after:bg-border"
                    ),
                props.className
            )}
        >
            <ModelRegistry.ProjectCard.Provider model={card}>
                <Table.FlexCell className="w-1/3 text-center">
                    <Button variant="link" className="size-auto p-0" onClick={() => navigate(ROUTES.BOARD.CARD(card.project_uid, card.uid))}>
                        {title}
                    </Button>
                </Table.FlexCell>
                <Table.FlexCell className="w-1/3 text-center">
                    <Button variant="link" className="size-auto p-0" onClick={() => navigate(ROUTES.BOARD.CARD(card.project_uid, card.uid))}>
                        {columnName}
                    </Button>
                </Table.FlexCell>
                <Table.FlexCell className="w-1/6 text-center">{createdAt}</Table.FlexCell>
                <Table.FlexCell className="w-1/6 text-center">
                    <CardRowTimeTaken />
                </Table.FlexCell>
            </ModelRegistry.ProjectCard.Provider>
        </Table.FlexRow>
    );
}

function CardRowTimeTaken() {
    const { model: card } = ModelRegistry.ProjectCard.useContext();
    const createdAt = card.useField("created_at");
    const archivedAt = card.useField("archived_at");
    const duration = useMemo(() => {
        if (!archivedAt) {
            return {};
        }

        const now = new Date();

        return intervalToDuration({
            start: now,
            end: addDate(now, { seconds: differenceInSeconds(archivedAt.getTime(), createdAt.getTime()) }),
        });
    }, [archivedAt]);

    return <>{archivedAt && Utils.String.formatTimerDuration(duration)}</>;
}

export default CardRow;
