/* eslint-disable @/max-len */
"use client";

import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import * as React from "react";
import IconComponent from "@/components/base/IconComponent";
import { cn } from "@/core/utils/ComponentUtils";

const Root = ContextMenuPrimitive.Root;

const Trigger = ContextMenuPrimitive.Trigger;

const Group = React.forwardRef<HTMLDivElement, { label?: React.ReactNode } & React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Group>>(
    ({ label, ...props }, ref) => {
        return (
            <>
                <Separator
                    className={cn(
                        "hidden",
                        "mb-0 shrink-0 peer-has-[[role=menuitem]]/menu-group:block peer-has-[[role=menuitemcheckbox]]/menu-group:block peer-has-[[role=option]]/menu-group:block"
                    )}
                />

                <ContextMenuPrimitive.Group
                    ref={ref}
                    {...props}
                    className={cn(
                        "hidden",
                        "peer/menu-group group/menu-group my-1.5 has-[[role=menuitem]]:block has-[[role=menuitemcheckbox]]:block has-[[role=option]]:block",
                        props.className
                    )}
                >
                    {label && <Label>{label}</Label>}
                    {props.children}
                </ContextMenuPrimitive.Group>
            </>
        );
    }
);

const Portal = ContextMenuPrimitive.Portal;

const Sub = ContextMenuPrimitive.Sub;

const RadioGroup = ContextMenuPrimitive.RadioGroup;

const SubTrigger = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
        inset?: bool;
    }
>(({ className, inset, children, ...props }, ref) => (
    <ContextMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[disabled]:opacity-50",
            inset && "pl-8",
            className
        )}
        {...props}
    >
        {children}
        <IconComponent icon="chevron-right" size="4" className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
));
SubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const SubContent = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.SubContent
        ref={ref}
        className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
));
SubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const Content = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
            ref={ref}
            className={cn(
                "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        />
    </ContextMenuPrimitive.Portal>
));
Content.displayName = ContextMenuPrimitive.Content.displayName;

const Item = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
        inset?: bool;
    }
>(({ className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            inset && "pl-8",
            className
        )}
        {...props}
    />
));
Item.displayName = ContextMenuPrimitive.Item.displayName;

const CheckboxItem = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <ContextMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        checked={checked}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <ContextMenuPrimitive.ItemIndicator>
                <IconComponent icon="check" size="4" />
            </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </ContextMenuPrimitive.CheckboxItem>
));
CheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

const RadioItem = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <ContextMenuPrimitive.RadioItem
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <ContextMenuPrimitive.ItemIndicator>
                <IconComponent icon="circle" size="2" className="fill-current" />
            </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </ContextMenuPrimitive.RadioItem>
));
RadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const Label = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
        inset?: bool;
    }
>(({ className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.Label
        ref={ref}
        className={cn("px-2 py-1.5 text-sm font-semibold text-foreground", inset && "pl-8", className)}
        {...props}
    />
));
Label.displayName = ContextMenuPrimitive.Label.displayName;

const Separator = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => <ContextMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />);
Separator.displayName = ContextMenuPrimitive.Separator.displayName;

const Shortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
    return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};
Shortcut.displayName = "ContextMenuShortcut";

export default {
    CheckboxItem,
    Content,
    Group,
    Item,
    Label,
    Portal,
    RadioGroup,
    RadioItem,
    Root,
    Separator,
    Shortcut,
    Sub,
    SubContent,
    SubTrigger,
    Trigger,
};
