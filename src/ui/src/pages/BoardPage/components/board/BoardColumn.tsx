"use client";

import { memo, useEffect, useMemo, useReducer, useRef, useState } from "react";
import invariant from "tiny-invariant";
import BoardColumnCard, { BoardColumnCardShadow, SkeletonBoardColumnCard } from "@/pages/BoardPage/components/board/BoardColumnCard";
import { useBoard } from "@/core/providers/BoardProvider";
import { Project, ProjectColumn } from "@/core/models";
import { BoardAddCardProvider } from "@/core/providers/BoardAddCardProvider";
import { Box, Card, Flex, ScrollArea, ShineBorder, Skeleton } from "@/components/base";
import BoardColumnHeader from "@/pages/BoardPage/components/board/BoardColumnHeader";
import { cn } from "@/core/utils/ComponentUtils";
import BoardColumnAddCard from "@/pages/BoardPage/components/board/BoardColumnAddCard";
import BoardColumnAddCardButton from "@/pages/BoardPage/components/board/BoardColumnAddCardButton";
import useBoardCardCreatedHandlers from "@/controllers/socket/board/useBoardCardCreatedHandlers";
import useBoardUIColumnDeletedHandlers from "@/controllers/socket/board/column/useBoardUIColumnDeletedHandlers";
import { Utils } from "@langboard/core/utils";
import { columnRowDndHelpers } from "@/core/helpers/dnd";
import { TColumnState } from "@/core/helpers/dnd/types";
import { BLOCK_BOARD_PANNING_ATTR, BOARD_DND_SETTINGS, BOARD_DND_SYMBOL_SET } from "@/pages/BoardPage/components/board/BoardConstants";
import { COLUMN_IDLE } from "@/core/helpers/dnd/createDndColumnEvents";
import useRowReordered from "@/core/hooks/useRowReordered";
import { useHasRunningBot } from "@/core/stores/BotStatusStore";

export function SkeletonBoardColumn({ cardCount }: { cardCount: number }) {
    return (
        <Card.Root className="my-1 w-80 flex-shrink-0 border-transparent">
            <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold">
                <Skeleton h="6" className="w-1/3" />
            </Card.Header>
            <Card.Content className="flex max-h-[calc(100vh_-_theme(spacing.52))] flex-grow flex-col gap-2 overflow-hidden p-3">
                <Box pb="2.5" className="overflow-hidden">
                    <Flex direction="col" gap="3">
                        {Array.from({ length: cardCount }).map(() => (
                            <SkeletonBoardColumnCard key={Utils.String.Token.shortUUID()} />
                        ))}
                    </Flex>
                </Box>
            </Card.Content>
        </Card.Root>
    );
}

const stateStyles: { [Key in TColumnState["type"]]: string } = {
    idle: "cursor-grab",
    "is-row-over": "ring-2 ring-primary",
    "is-dragging": "opacity-40 ring-2 ring-primary",
    "is-column-over": "bg-secondary",
};

export interface IBoardColumnProps {
    column: ProjectColumn.TModel;
    updateBoard: () => void;
}

function BoardColumn({ column, updateBoard }: IBoardColumnProps) {
    const { hasRoleAction } = useBoard();
    const scrollableRef = useRef<HTMLDivElement | null>(null);
    const outerFullHeightRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<TColumnState>(COLUMN_IDLE);
    const order = column.useField("order");
    const hasRunningBot = useHasRunningBot({ type: "project_column", targetUID: column.uid });

    useEffect(() => {
        const outer = outerFullHeightRef.current;
        const scrollable = scrollableRef.current;
        const header = headerRef.current;
        const inner = innerRef.current;
        invariant(outer);
        invariant(scrollable);
        invariant(header);
        invariant(inner);

        return columnRowDndHelpers.column({
            column,
            symbolSet: BOARD_DND_SYMBOL_SET,
            draggable: header,
            dropTarget: outer,
            scrollable,
            settings: BOARD_DND_SETTINGS,
            setState,
            renderPreview({ container }) {
                // Simple drag preview generation: just cloning the current element.
                // Not using react for this.
                const rect = outer.getBoundingClientRect();
                const preview = outer.cloneNode(true);
                invariant(Utils.Type.isElement(preview, "div"));
                preview.classList.add("ring-2", "ring-primary");
                preview.style.width = `${rect.width}px`;
                preview.style.height = `${rect.height}px`;

                container.appendChild(preview);
            },
        });
    }, [column, order]);

    return (
        <BoardAddCardProvider column={column} viewportRef={scrollableRef} toLastPage={() => {}}>
            <Card.Root
                ref={outerFullHeightRef}
                className={cn(
                    "relative my-1 w-72 flex-shrink-0 snap-center shadow-md shadow-black/30 ring-primary dark:shadow-border/90 sm:w-80",
                    stateStyles[state.type]
                )}
            >
                {hasRunningBot && <ShineBorder />}
                <BoardColumnHeader isDragging={state.type !== "idle"} column={column} headerProps={{ ref: headerRef }} />
                <ScrollArea.Root viewportRef={scrollableRef} viewportClassName="!overflow-y-auto">
                    <Card.Content
                        className={cn(
                            "flex flex-grow flex-col gap-2 p-3",
                            hasRoleAction(Project.ERoleAction.CardWrite) && !column.is_archive
                                ? "max-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.2))]"
                                : "max-h-[calc(100vh_-_theme(spacing.56)_-_theme(spacing.1))]"
                        )}
                        {...{ [BLOCK_BOARD_PANNING_ATTR]: true }}
                        ref={innerRef}
                    >
                        <BoardColumnCardList column={column} updateBoard={updateBoard} />
                        {state.type === "is-row-over" && !state.isOverChildRow && <BoardColumnCardShadow dragging={state.dragging} />}
                        <BoardColumnAddCard />
                    </Card.Content>
                    <ScrollArea.Bar />
                </ScrollArea.Root>
                <Card.Footer className="px-3 py-2">
                    <BoardColumnAddCardButton />
                </Card.Footer>
            </Card.Root>
        </BoardAddCardProvider>
    );
}

/**
 * A memoized component for rendering out the card.
 *
 * Created so that state changes to the column don't require all cards to be rendered
 */
const BoardColumnCardList = memo(({ column, updateBoard }: IBoardColumnProps) => {
    const { project, socket, filters, filterCard, filterCardMember, filterCardLabels, filterCardRelationships } = useBoard();
    const updater = useReducer((x) => x + 1, 0);
    const [_, forceUpdate] = updater;
    const cardCreatedHandlers = useMemo(
        () =>
            useBoardCardCreatedHandlers({
                projectUID: project.uid,
                columnUID: column.uid,
                callback: () => {
                    forceUpdate();
                },
            }),
        [forceUpdate]
    );
    const columnDeletedHandlers = useMemo(
        () =>
            useBoardUIColumnDeletedHandlers({
                project,
                callback: () => {
                    if (!column.is_archive) {
                        return;
                    }

                    forceUpdate();
                    updateBoard();
                },
            }),
        [updateBoard, forceUpdate]
    );
    const { rows: columnCards } = useRowReordered({
        type: "ProjectCard",
        eventNameParams: { uid: column.uid },
        topicId: project.uid,
        rowFilter: (model) => {
            return (
                model.project_column_uid === column.uid &&
                filterCard(model) &&
                filterCardMember(model) &&
                filterCardLabels(model) &&
                filterCardRelationships(model)
            );
        },
        rowDependencies: [filters],
        columnUID: column.uid,
        socket,
        updater,
        otherHandlers: [cardCreatedHandlers, columnDeletedHandlers],
    });

    return columnCards.map((card) => <BoardColumnCard key={card.uid} card={card} />);
});

export default BoardColumn;
