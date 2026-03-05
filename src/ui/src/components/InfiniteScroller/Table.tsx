import React, { cloneElement, forwardRef, isValidElement } from "react";
import { useVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { cn } from "@/core/utils/ComponentUtils";
import { Box, ScrollArea, Table } from "@/components/base";
import { Utils } from "@langboard/core/utils";
import { TSharedInfiniteScrollerProps } from "@/components/InfiniteScroller/types";
import useInfiniteScrollerVirtualizer from "@/components/InfiniteScroller/useInfiniteScrollerVirtualizer";
import { composeRefs } from "@/core/utils/ComponentUtils";

interface ITableColumn {
    name: React.ReactNode;
    className?: string;
}

export interface ITableInfiniteScrollerProps extends Omit<TSharedInfiniteScrollerProps<HTMLDivElement>, "loaderClassName"> {
    columns: ITableColumn[];
    headerClassName?: string;
    totalCount: number;
    virtualizerRef?: React.RefObject<ReturnType<typeof useVirtualizer> | undefined>;
}

const Default = forwardRef<HTMLTableElement, ITableInfiniteScrollerProps>(
    (
        {
            hasMore,
            initialLoad,
            loadMore,
            pageStart,
            loader,
            scrollable,
            gap,
            columns,
            headerClassName,
            totalCount,
            virtualizerRef,
            children,
            ...props
        },
        ref
    ) => {
        const { setLoaderRef, items, virtualizer } = useInfiniteScrollerVirtualizer({
            hasMore,
            initialLoad,
            loadMore,
            pageStart,
            loader,
            scrollable,
            gap,
            totalCount,
            virtualizerRef,
            children,
        });

        const virtualItems = virtualizer.getVirtualItems();
        const loaderIndex = hasMore ? (virtualItems[virtualItems.length - 1]?.index ?? "-1") : "-1";
        const loaderY = hasMore ? (virtualItems[virtualItems.length - 1]?.start ?? -99999) : -99999;

        return (
            <Box>
                <Table.FlexRoot {...props} ref={ref}>
                    <Table.FlexHeader className={headerClassName}>
                        <Table.FlexRow>
                            {columns.map((column) => (
                                <Table.FlexHead key={Utils.String.Token.shortUUID()} className={column.className}>
                                    {column.name}
                                </Table.FlexHead>
                            ))}
                        </Table.FlexRow>
                    </Table.FlexHeader>
                    <Table.FlexBody className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                        {virtualItems.map((virtualRow, index) =>
                            hasMore && index === virtualItems.length - 1 ? null : (
                                <Row virtualizer={virtualizer} virtualRow={virtualRow} key={virtualRow.index}>
                                    {items[virtualRow.index]}
                                </Row>
                            )
                        )}
                        <Table.FlexRow
                            key={Utils.String.Token.shortUUID()}
                            className={cn("absolute left-0 top-0 w-full items-center justify-center border-none", !hasMore && "hidden")}
                            data-index={loaderIndex}
                            style={{
                                transform: `translateY(${loaderY}px)`,
                            }}
                            ref={composeRefs(setLoaderRef, virtualizer.measureElement as React.Ref<HTMLDivElement>)}
                        >
                            {loader}
                        </Table.FlexRow>
                    </Table.FlexBody>
                </Table.FlexRoot>
            </Box>
        );
    }
);

export interface IWithBodyScrollerProps
    extends Omit<ITableInfiniteScrollerProps, "scrollable">, Pick<React.ComponentProps<typeof ScrollArea.Root>, "mutable"> {
    innerClassName?: string;
}

const WithBodyScroller = forwardRef<HTMLTableElement, IWithBodyScrollerProps>(
    (
        {
            hasMore,
            initialLoad,
            loadMore,
            pageStart,
            loader,
            columns,
            mutable,
            headerClassName,
            innerClassName,
            gap,
            totalCount,
            virtualizerRef,
            children,
            ...props
        },
        ref
    ) => {
        const viewportRef = React.useRef<HTMLDivElement>(null);
        const { setLoaderRef, items, virtualizer } = useInfiniteScrollerVirtualizer({
            hasMore,
            initialLoad,
            loadMore,
            pageStart,
            loader,
            scrollable: () => viewportRef.current,
            gap,
            totalCount,
            virtualizerRef,
            children,
        });

        const virtualItems = virtualizer.getVirtualItems();
        const loaderIndex = hasMore ? (virtualItems[virtualItems.length - 1]?.index ?? "-1") : "-1";
        const loaderY = hasMore ? (virtualItems[virtualItems.length - 1]?.start ?? -99999) : -99999;

        return (
            <>
                <Table.FlexRoot {...props} className={headerClassName}>
                    <Table.FlexHeader>
                        <Table.FlexRow>
                            {columns.map((column) => (
                                <Table.FlexHead key={Utils.String.Token.shortUUID()} className={column.className}>
                                    {column.name}
                                </Table.FlexHead>
                            ))}
                        </Table.FlexRow>
                    </Table.FlexHeader>
                </Table.FlexRoot>
                <ScrollArea.Root mutable={mutable} viewportRef={viewportRef}>
                    <Box className={innerClassName} style={{ height: `${virtualizer.getTotalSize()}px` }}>
                        <Table.FlexRoot {...props} className={cn(props.className, "h-full")} ref={ref}>
                            <Table.FlexBody className="relative h-full">
                                {virtualItems.map((virtualRow, index) =>
                                    hasMore && index === virtualItems.length - 1 ? null : (
                                        <Row virtualizer={virtualizer} virtualRow={virtualRow} key={virtualRow.index}>
                                            {items[virtualRow.index]}
                                        </Row>
                                    )
                                )}
                                <Table.FlexRow
                                    key={Utils.String.Token.shortUUID()}
                                    className={cn("absolute left-0 top-0 w-full items-center justify-center border-none", !hasMore && "hidden")}
                                    data-index={loaderIndex}
                                    style={{
                                        transform: `translateY(${loaderY}px)`,
                                    }}
                                    ref={composeRefs(setLoaderRef, virtualizer.measureElement as React.Ref<HTMLDivElement>)}
                                >
                                    {loader}
                                </Table.FlexRow>
                            </Table.FlexBody>
                        </Table.FlexRoot>
                    </Box>
                </ScrollArea.Root>
            </>
        );
    }
);

interface ITableRowInfiniteScrollerProps extends React.HTMLAttributes<HTMLTableRowElement> {
    virtualizer: Virtualizer<HTMLElement, HTMLElement>;
    virtualRow: VirtualItem;
}

const Row = ({ virtualizer, virtualRow, children, ...props }: ITableRowInfiniteScrollerProps) => {
    const rowProps = {
        ...props,
        className: cn(props.className, "absolute left-0 top-0 w-full"),
        ref: virtualizer.measureElement,
        style: {
            transform: `translateY(${virtualRow.start}px)`,
        },
        "data-index": virtualRow.index,
    };

    if (isValidElement<React.ComponentProps<typeof Table.FlexRow>>(children)) {
        const elem = cloneElement(children, {
            ...rowProps,
            ...children.props,
            key: virtualRow.index,
            ref: virtualizer.measureElement,
            className: cn(children.props.className, rowProps.className),
        });

        return elem;
    }

    return (
        <Table.FlexRow key={virtualRow.index} {...rowProps}>
            {children}
        </Table.FlexRow>
    );
};

const TableInfiniteScroller = {
    Default,
    WithBodyScroller,
};

export default TableInfiniteScroller;
