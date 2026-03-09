/* eslint-disable @/max-len */
"use client";

import { OTPInput, OTPInputContext, REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import * as React from "react";
import IconComponent from "@/components/base/IconComponent";
import { cn } from "@/core/utils/ComponentUtils";

const Root = React.forwardRef<React.ComponentRef<typeof OTPInput>, React.ComponentPropsWithoutRef<typeof OTPInput>>(
    ({ className, containerClassName, ...props }, ref) => (
        <OTPInput
            ref={ref}
            containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
            className={cn("disabled:cursor-not-allowed", className)}
            {...props}
        />
    )
);
Root.displayName = "InputOTP";

const Group = React.forwardRef<React.ComponentRef<"div">, React.ComponentPropsWithoutRef<"div">>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
Group.displayName = "InputOTPGroup";

const Slot = React.forwardRef<React.ComponentRef<"div">, React.ComponentPropsWithoutRef<"div"> & { index: number }>(
    ({ index, className, ...props }, ref) => {
        const inputOTPContext = React.useContext(OTPInputContext);
        const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
                    isActive && "z-10 ring-2 ring-ring ring-offset-background",
                    className
                )}
                {...props}
            >
                {char}
                {hasFakeCaret && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
                    </div>
                )}
            </div>
        );
    }
);
Slot.displayName = "InputOTPSlot";

const Separator = React.forwardRef<React.ComponentRef<"div">, React.ComponentPropsWithoutRef<"div">>(({ ...props }, ref) => (
    <div ref={ref} role="separator" {...props}>
        <IconComponent icon="dot" />
    </div>
));
Separator.displayName = "InputOTPSeparator";

export default {
    Group,
    REGEXP_ONLY_CHARS,
    REGEXP_ONLY_DIGITS,
    REGEXP_ONLY_DIGITS_AND_CHARS,
    Root,
    Separator,
    Slot,
};
