/* eslint-disable @/max-len */
"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as React from "react";
import IconComponent from "@/components/base/IconComponent";
import { cn } from "@/core/utils/ComponentUtils";
import { useCallback, useState } from "react";

const Root = DropdownMenuPrimitive.Root;

const Trigger = DropdownMenuPrimitive.Trigger;

const Group = React.forwardRef<HTMLDivElement, { label?: React.ReactNode } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>>(
    ({ label, ...props }, ref) => {
        return (
            <>
                <Separator
                    className={cn(
                        "hidden",
                        "mb-0 shrink-0 peer-has-[[role=menuitem]]/menu-group:block peer-has-[[role=menuitemcheckbox]]/menu-group:block peer-has-[[role=option]]/menu-group:block"
                    )}
                />

                <DropdownMenuPrimitive.Group
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
                </DropdownMenuPrimitive.Group>
            </>
        );
    }
);

const Portal = DropdownMenuPrimitive.Portal;

const Sub = DropdownMenuPrimitive.Sub;

const RadioGroup = React.forwardRef<
    HTMLDivElement,
    { label?: React.ReactNode } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioGroup>
>(({ label, ...props }, ref) => {
    return (
        <>
            <Separator
                className={cn("hidden", "mb-0 shrink-0 peer-has-[[role=menuitemradio]]/menu-group:block peer-has-[[role=option]]/menu-group:block")}
            />

            <DropdownMenuPrimitive.RadioGroup
                ref={ref}
                {...props}
                className={cn(
                    "hidden",
                    "peer/menu-group group/menu-group my-1.5 has-[[role=menuitemradio]]:block has-[[role=option]]:block",
                    props.className
                )}
            >
                {label && <Label>{label}</Label>}
                {props.children}
            </DropdownMenuPrimitive.RadioGroup>
        </>
    );
});

const SubTrigger = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
        inset?: bool;
    }
>(({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[state=open]:bg-accent data-[disabled]:opacity-50",
            inset && "pl-8",
            className
        )}
        {...props}
    >
        {children}
        <IconComponent icon="chevron-right" size="4" className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
));

SubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const SubContent = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
        ref={ref}
        className={cn(
            "z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
));
SubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const Content = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "z-50 min-w-32 overflow-hidden rounded-md border bg-popover px-1 text-popover-foreground shadow-md",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        />
    </DropdownMenuPrimitive.Portal>
));
Content.displayName = DropdownMenuPrimitive.Content.displayName;

const Item = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
        inset?: bool;
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            inset && "pl-8",
            className
        )}
        {...props}
    />
));
Item.displayName = DropdownMenuPrimitive.Item.displayName;

const CheckboxItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        checked={checked}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <IconComponent icon="check" size="4" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
));
CheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const RadioItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
        hideIcon?: bool;
    }
>(({ className, children, hideIcon, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    >
        {!hideIcon && (
            <span className="absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <IconComponent icon="dot" size="4" className="fill-current" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
        )}
        {children}
    </DropdownMenuPrimitive.RadioItem>
));
RadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const Label = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
        inset?: bool;
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
        ref={ref}
        className={cn("px-2 py-1.5 text-sm font-semibold text-muted-foreground/70", inset && "pl-8", className)}
        {...props}
    />
));
Label.displayName = DropdownMenuPrimitive.Label.displayName;

const Separator = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />);
Separator.displayName = DropdownMenuPrimitive.Separator.displayName;

const Shortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
    return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
};
Shortcut.displayName = "DropdownMenuShortcut";

const useOpenState = () => {
    const [open, setOpen] = useState(false);

    const onOpenChange = useCallback(
        (_value = !open) => {
            setOpen(_value);
        },
        [open]
    );

    return {
        open,
        onOpenChange,
    };
};

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
    useOpenState,
};
