/* eslint-disable @/max-len */
"use client";

import * as MenubarPrimitive from "@radix-ui/react-menubar";
import * as React from "react";
import IconComponent from "@/components/base/IconComponent";
import { cn } from "@/core/utils/ComponentUtils";

const Menu = MenubarPrimitive.Menu;

const Group = MenubarPrimitive.Group;

const Portal = MenubarPrimitive.Portal;

const Sub = MenubarPrimitive.Sub;

const RadioGroup = MenubarPrimitive.RadioGroup;

const Root = React.forwardRef<React.ComponentRef<typeof MenubarPrimitive.Root>, React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>>(
    ({ className, ...props }, ref) => (
        <MenubarPrimitive.Root
            ref={ref}
            className={cn("flex h-10 items-center space-x-1 rounded-md border bg-background p-1", className)}
            {...props}
        />
    )
);
Root.displayName = MenubarPrimitive.Root.displayName;

const Trigger = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Trigger
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
            className
        )}
        {...props}
    />
));
Trigger.displayName = MenubarPrimitive.Trigger.displayName;

const SubTrigger = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
        inset?: bool;
    }
>(({ className, inset, children, ...props }, ref) => (
    <MenubarPrimitive.SubTrigger
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
            inset && "pl-8",
            className
        )}
        {...props}
    >
        {children}
        <IconComponent icon="chevron-right" size="4" className="ml-auto" />
    </MenubarPrimitive.SubTrigger>
));
SubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const SubContent = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.SubContent
        ref={ref}
        className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
));
SubContent.displayName = MenubarPrimitive.SubContent.displayName;

const Content = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = "start", alignOffset = -4, sideOffset = 8, ...props }, ref) => (
    <MenubarPrimitive.Portal>
        <MenubarPrimitive.Content
            ref={ref}
            align={align}
            alignOffset={alignOffset}
            sideOffset={sideOffset}
            className={cn(
                "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        />
    </MenubarPrimitive.Portal>
));
Content.displayName = MenubarPrimitive.Content.displayName;

const Item = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
        inset?: bool;
    }
>(({ className, inset, ...props }, ref) => (
    <MenubarPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            inset && "pl-8",
            className
        )}
        {...props}
    />
));
Item.displayName = MenubarPrimitive.Item.displayName;

const CheckboxItem = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <MenubarPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        checked={checked}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <MenubarPrimitive.ItemIndicator>
                <IconComponent icon="check" size="4" />
            </MenubarPrimitive.ItemIndicator>
        </span>
        {children}
    </MenubarPrimitive.CheckboxItem>
));
CheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

const RadioItem = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <MenubarPrimitive.RadioItem
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <MenubarPrimitive.ItemIndicator>
                <IconComponent icon="circle" size="2" className="fill-current" />
            </MenubarPrimitive.ItemIndicator>
        </span>
        {children}
    </MenubarPrimitive.RadioItem>
));
RadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

const Label = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
        inset?: bool;
    }
>(({ className, inset, ...props }, ref) => (
    <MenubarPrimitive.Label ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
));
Label.displayName = MenubarPrimitive.Label.displayName;

const Separator = React.forwardRef<
    React.ComponentRef<typeof MenubarPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => <MenubarPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />);
Separator.displayName = MenubarPrimitive.Separator.displayName;

const Shortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
    return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};
Shortcut.displayname = "MenubarShortcut";

export default {
    CheckboxItem,
    Content,
    Group,
    Item,
    Label,
    Menu,
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
