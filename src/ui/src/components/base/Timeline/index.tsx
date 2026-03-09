import React from "react";
import { VariantProps, tv } from "tailwind-variants";
import IconComponent from "@/components/base/IconComponent";
import { cn } from "@/core/utils/ComponentUtils";

export const TimelineVariants = tv(
    {
        base: "grid",
        variants: {
            positions: {
                left: "[&>li]:grid-cols-[0_min-content_1fr]",
                right: "[&>li]:grid-cols-[1fr_min-content]",
                center: "[&>li]:grid-cols-[1fr_min-content_1fr]",
            },
        },
        defaultVariants: {
            positions: "left",
        },
    },
    {
        responsiveVariants: true,
    }
);

interface TimelineProps extends React.HTMLAttributes<HTMLUListElement>, VariantProps<typeof TimelineVariants> {}

const Root = React.forwardRef<HTMLUListElement, TimelineProps>(({ children, className, positions, ...props }, ref) => {
    return (
        <ul className={cn(TimelineVariants({ positions }), className)} ref={ref} {...props}>
            {children}
        </ul>
    );
});
Root.displayName = "Timeline";

const timelineItemVariants = tv(
    {
        base: "grid items-center gap-x-2",
        variants: {
            status: {
                done: "text-primary",
                default: "text-muted-foreground",
            },
        },
        defaultVariants: {
            status: "default",
        },
    },
    {
        responsiveVariants: true,
    }
);

interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement>, VariantProps<typeof timelineItemVariants> {}

const Item = React.forwardRef<HTMLLIElement, TimelineItemProps>(({ className, status, ...props }, ref) => (
    <li className={cn(timelineItemVariants({ status }), className)} ref={ref} {...props} />
));
Item.displayName = "TimelineItem";

const timelineDotVariants = tv(
    {
        base: "col-start-2 col-end-3 row-start-1 row-end-1 flex size-4 items-center justify-center rounded-full border border-current",
        variants: {
            status: {
                default: "[&>*]:hidden",
                current: "[&>*:not(.lucide-circle)]:hidden [&>.lucide-circle]:fill-current [&>.lucide-circle]:text-current",
                done: "bg-primary [&>*:not(.lucide-check)]:hidden [&>.lucide-check]:text-background",
                error: "border-destructive bg-destructive [&>*:not(.lucide-x)]:hidden [&>.lucide-x]:text-background",
                custom: "[&>*:not(:nth-child(4))]:hidden [&>*:nth-child(4)]:block",
            },
        },
        defaultVariants: {
            status: "default",
        },
    },
    {
        responsiveVariants: true,
    }
);

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof timelineDotVariants> {
    customIcon?: React.ReactNode;
}

const Dot = React.forwardRef<HTMLDivElement, TimelineDotProps>(({ className, status, customIcon, ...props }, ref) => (
    <div role="status" className={cn("timeline-dot", timelineDotVariants({ status }), className)} ref={ref} {...props}>
        <IconComponent icon="circle" className="size-2.5" />
        <IconComponent icon="check" size="3" />
        <IconComponent icon="x" size="3" />
        {customIcon}
    </div>
));
Dot.displayName = "TimelineDot";

const timelineContentVariants = tv(
    {
        base: "row-start-2 row-end-2 pb-8 text-muted-foreground",
        variants: {
            side: {
                right: "col-start-3 col-end-4 mr-auto text-left",
                left: "col-start-1 col-end-2 ml-auto text-right",
            },
        },
        defaultVariants: {
            side: "right",
        },
    },
    {
        responsiveVariants: true,
    }
);

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof timelineContentVariants> {}

const Content = React.forwardRef<HTMLDivElement, TimelineContentProps>(({ className, side, ...props }, ref) => (
    <div className={cn(timelineContentVariants({ side }), className)} ref={ref} {...props} />
));
Content.displayName = "TimelineContent";

const timelineHeadingVariants = tv(
    {
        base: "row-start-1 row-end-1 line-clamp-1 max-w-full truncate",
        variants: {
            side: {
                right: "col-start-3 col-end-4 mr-auto text-left",
                left: "col-start-1 col-end-2 ml-auto text-right",
            },
            variant: {
                primary: "text-base font-medium text-primary",
                secondary: "text-sm font-light text-muted-foreground",
            },
        },
        defaultVariants: {
            side: "right",
            variant: "primary",
        },
    },
    {
        responsiveVariants: true,
    }
);

interface TimelineHeadingProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof timelineHeadingVariants> {}

const Heading = React.forwardRef<HTMLDivElement, TimelineHeadingProps>(({ className, side, variant, ...props }, ref) => (
    <div
        role="heading"
        aria-level={variant === "primary" ? 2 : 3}
        className={cn(timelineHeadingVariants({ side, variant }), className)}
        ref={ref}
        {...props}
    />
));
Heading.displayName = "TimelineHeading";

interface TimelineLineProps extends React.HTMLAttributes<HTMLHRElement> {
    done?: bool;
}

const Line = React.forwardRef<HTMLHRElement, TimelineLineProps>(({ className, done = false, ...props }, ref) => {
    return (
        <hr
            role="separator"
            aria-orientation="vertical"
            className={cn(
                "col-start-2 col-end-3 row-start-2 row-end-2 mx-auto flex h-full min-h-16 w-0.5 justify-center rounded-full",
                done ? "bg-primary" : "bg-muted",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Line.displayName = "TimelineLine";

export default {
    Content,
    Dot,
    Heading,
    Item,
    Line,
    Root,
};
