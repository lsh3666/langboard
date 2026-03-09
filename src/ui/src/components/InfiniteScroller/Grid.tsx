import { Children, cloneElement, forwardRef, isValidElement, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/core/utils/ComponentUtils";
import useInfiniteScrollerVirtualizer from "@/components/InfiniteScroller/useInfiniteScrollerVirtualizer";
import { TSharedInfiniteScrollerProps } from "@/components/InfiniteScroller/types";
import { composeRefs } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import Box from "@/components/base/Box";
import { useVirtualizer } from "@tanstack/react-virtual";

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

export interface IGridInfiniteScrollerProps extends TSharedInfiniteScrollerProps<React.ReactElement> {
    as?: React.ElementType;
    row?: React.ElementType;
    rowClassName?: string;
    totalCount: number;
    virtualizerRef?: React.RefObject<ReturnType<typeof useVirtualizer>>;
}

const GridInfiniteScroller = forwardRef<HTMLElement, IGridInfiniteScrollerProps>(
    (
        {
            hasMore,
            initialLoad,
            loadMore,
            pageStart,
            loader,
            loaderClassName,
            scrollable,
            as = "div",
            row = "div",
            rowClassName,
            className,
            totalCount,
            virtualizerRef,
            children,
            gap = "16",
            ...props
        },
        ref
    ) => {
        const Comp = as;
        const RowComp = row;
        const containerRef = useRef<HTMLElement | null>(null);
        const measureRef = useRef<HTMLElement>(null);

        const flatItems = Children.toArray(children).filter(isValidElement) as React.ReactElement[];
        const [columnCount, setColumnCount] = useState(1);

        // measure column count from actual DOM (via user-defined grid classes)
        useLayoutEffect(() => {
            const rowEl = measureRef.current;
            if (rowEl) {
                const children = Array.from(rowEl.children);
                let firstChildOffsetTop = -1;
                let count = 0;
                for (let i = 0; i < children.length; ++i) {
                    const child = children[i] as HTMLElement;
                    if (child.offsetParent === null) {
                        continue;
                    }

                    if (firstChildOffsetTop === -1) {
                        firstChildOffsetTop = child.offsetTop;
                    }

                    if (firstChildOffsetTop !== child.offsetTop) {
                        break;
                    }

                    ++count;
                }

                if (count > 0) {
                    setColumnCount(count);
                }
            }
        }, [children]);

        gap = Utils.Type.isString(gap) ? parseInt(gap) : gap;

        const sampleRow = (
            <RowComp
                ref={measureRef}
                className={cn(rowClassName, "pointer-events-none invisible absolute grid w-full")}
                style={{ display: "grid", gap: `${gap}px`, padding: `${gap / 2}px` }}
            >
                {flatItems}
            </RowComp>
        );

        const chunked = chunkArray(flatItems, columnCount);
        const totalRowCount = Math.ceil(totalCount / Math.max(1, columnCount)) + (hasMore ? 1 : 0);

        const { setLoaderRef, items, virtualizer } = useInfiniteScrollerVirtualizer({
            hasMore,
            initialLoad,
            loadMore,
            pageStart,
            loader,
            scrollable,
            totalCount: totalRowCount,
            virtualizerRef,
            children: chunked,
        });

        const virtualItems = virtualizer.getVirtualItems();
        const loaderIndex = hasMore ? (virtualItems[virtualItems.length - 1]?.index ?? "-1") : "-1";
        const loaderY = hasMore ? (virtualItems[virtualItems.length - 1]?.start ?? -99999) : -99999;

        return (
            <Comp
                {...props}
                className={cn(className, "relative")}
                style={{
                    ...props.style,
                    height: `${virtualizer.getTotalSize()}px`,
                }}
                ref={composeRefs(ref, containerRef)}
            >
                {sampleRow}

                {virtualItems.map((virtualRow, index) => {
                    if (hasMore && index === virtualItems.length - 1) {
                        return null;
                    }

                    const rowItems = items[virtualRow.index] as React.ReactElement[];
                    if (!rowItems) {
                        return null;
                    }

                    return (
                        <RowComp
                            key={virtualRow.index}
                            className={cn(rowClassName, "absolute left-0 top-0 grid w-full")}
                            data-index={virtualRow.index}
                            style={{
                                transform: `translateY(${virtualRow.start}px)`,
                                gap: `${gap}px`,
                                padding: `${gap / 2}px`,
                                boxSizing: "border-box",
                            }}
                            ref={virtualizer.measureElement}
                        >
                            {Array.from(rowItems).map((item, colIndex) =>
                                isValidElement(item)
                                    ? cloneElement(item, {
                                          key: item.key ?? `${virtualRow.index}-${colIndex}`,
                                      })
                                    : null
                            )}
                        </RowComp>
                    );
                })}

                <Box
                    key={Utils.String.Token.shortUUID()}
                    className={cn(loaderClassName, "absolute left-0 top-0 w-full", !hasMore && "hidden")}
                    data-index={loaderIndex}
                    style={{
                        transform: `translateY(${loaderY}px)`,
                    }}
                    ref={composeRefs(setLoaderRef, virtualizer.measureElement as React.Ref<HTMLDivElement | null>)}
                >
                    {loader}
                </Box>
            </Comp>
        );
    }
);

export default GridInfiniteScroller;
