"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as React from "react";
import { cn } from "@/core/utils/ComponentUtils";
import IconComponent from "@/components/base/IconComponent";

const Root = AccordionPrimitive.Root;

const Item = React.forwardRef<React.ComponentRef<typeof AccordionPrimitive.Item>, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>>(
    ({ className, ...props }, ref) => <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
);
Item.displayName = "AccordionItem";

const Trigger = React.forwardRef<
    React.ComponentRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
                // eslint-disable-next-line @/max-len
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
                className
            )}
            {...props}
        >
            {children}
            <IconComponent icon="chevron-down" size="4" className="shrink-0 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
));
Trigger.displayName = AccordionPrimitive.Trigger.displayName;

const Content = React.forwardRef<
    React.ComponentRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}
    >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
));

Content.displayName = AccordionPrimitive.Content.displayName;

export default { Content, Item, Root, Trigger };
