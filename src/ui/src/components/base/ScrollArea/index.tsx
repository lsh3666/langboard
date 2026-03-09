"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@/components/base/ScrollArea/Primitive";
import { cn } from "@/core/utils/ComponentUtils";

export interface IScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
    viewportId?: string;
    viewportClassName?: string;
    viewportRef?: React.Ref<HTMLDivElement>;
    viewportAsTable?: bool;
    viewportDisplayClassName?: string;
    viewportDisplayRef?: React.Ref<HTMLDivElement>;
    mutable?: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>["mutable"];
}

const Root = React.forwardRef<React.ComponentRef<typeof ScrollAreaPrimitive.Root>, IScrollAreaProps>(
    (
        {
            className,
            children,
            viewportId,
            viewportClassName,
            viewportRef,
            viewportAsTable,
            viewportDisplayClassName,
            viewportDisplayRef,
            mutable,
            onScroll,
            ...props
        },
        ref
    ) => (
        <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
            <ScrollAreaPrimitive.Viewport
                className={cn("h-full w-full rounded-[inherit]", viewportClassName)}
                id={viewportId}
                onScroll={onScroll}
                asTable={viewportAsTable}
                displayClassName={viewportDisplayClassName}
                displayRef={viewportDisplayRef}
                ref={viewportRef}
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <Bar mutable={mutable} />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    )
);
Root.displayName = ScrollAreaPrimitive.Root.displayName;

const Bar = React.forwardRef<
    React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
            "flex cursor-pointer touch-none select-none transition-colors",
            orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-px",
            orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-px",
            className
        )}
        {...props}
    >
        <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
Bar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export default {
    Root,
    Bar,
};
