import { cn } from "@/core/utils/ComponentUtils";
import { extractVariantProps } from "@/core/utils/VariantUtils";
import { forwardRef } from "react";
import { tv, VariantProps } from "tailwind-variants";

const PillListRootVariants = tv({
    base: "flex flex-col gap-3",
});

export interface IPillListRootProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof PillListRootVariants> {}

const Root = forwardRef<HTMLDivElement, IPillListRootProps>(({ className, ...props }, ref) => {
    const variants = extractVariantProps(PillListRootVariants, props);
    return <div ref={ref} className={cn(PillListRootVariants({ ...variants }), className)} {...props} />;
});

const PillListItemRootVariants = tv(
    {
        base: "flex items-center justify-between border rounded-md transition-all duration-200 hover:bg-accent",
        variants: {
            size: {
                xs: "px-2 py-1 text-xs",
                sm: "px-3 py-2 text-sm",
                md: "px-4 py-2 text-base",
                lg: "px-6 py-3 text-lg",
            },
        },
        defaultVariants: {
            size: "sm",
        },
    },
    {
        responsiveVariants: true,
    }
);

export interface IPillListItemRootProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof PillListItemRootVariants> {}

const ItemRoot = forwardRef<HTMLDivElement, IPillListItemRootProps>(({ className, ...props }, ref) => {
    const variants = extractVariantProps(PillListItemRootVariants, props);
    return <div ref={ref} className={cn(PillListItemRootVariants({ ...variants }), className)} {...props} />;
});

const PillListItemTitleVariants = tv({
    base: "flex items-center gap-2 w-full",
});

export interface IPillListItemTitleProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof PillListItemTitleVariants> {}

const ItemTitle = forwardRef<HTMLDivElement, IPillListItemTitleProps>(({ className, ...props }, ref) => {
    const variants = extractVariantProps(PillListItemTitleVariants, props);
    return <div ref={ref} className={cn(PillListItemTitleVariants({ ...variants }), className)} {...props} />;
});

const PillListItemContentVariants = tv({
    base: "",
});

export interface IPillListItemContentProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof PillListItemContentVariants> {}

const ItemContent = forwardRef<HTMLDivElement, IPillListItemContentProps>(({ className, ...props }, ref) => {
    const variants = extractVariantProps(PillListItemContentVariants, props);
    return <div ref={ref} className={cn(PillListItemContentVariants({ ...variants }), className)} {...props} />;
});

export { Root, ItemRoot, ItemTitle, ItemContent };
