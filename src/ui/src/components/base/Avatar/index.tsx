"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";
import { cn } from "@/core/utils/ComponentUtils";

const Variants = tv(
    {
        base: "relative flex shrink-0 overflow-hidden rounded-full",
        variants: {
            size: {
                default: "size-10 text-base",
                xs: "size-6 text-xs",
                sm: "size-8 text-xs",
                lg: "size-14 text-2xl",
                "2xl": "size-20 text-3xl",
                "3xl": "size-28 text-4xl",
                "4xl": "size-36 text-5xl",
                "5xl": "size-48 text-6xl",
            },
        },
        defaultVariants: {
            size: "default",
        },
    },
    {
        responsiveVariants: true,
    }
);

export interface IAvatarProps extends AvatarPrimitive.AvatarProps, VariantProps<typeof Variants> {}

type TAvatarProps = React.ForwardRefExoticComponent<IAvatarProps & React.RefAttributes<HTMLSpanElement>>;

const Root = React.memo(
    React.forwardRef<React.ComponentRef<TAvatarProps>, React.ComponentPropsWithoutRef<TAvatarProps>>(({ className, size, ...props }, ref) => (
        <AvatarPrimitive.Root ref={ref} className={cn("select-none", Variants({ size }), className)} {...props} />
    ))
);
Root.displayName = AvatarPrimitive.Root.displayName;

const Image = React.memo(
    React.forwardRef<React.ComponentRef<typeof AvatarPrimitive.Image>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>>(
        ({ className, ...props }, ref) => <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
    )
);
Image.displayName = AvatarPrimitive.Image.displayName;

const Fallback = React.memo(
    React.forwardRef<React.ComponentRef<typeof AvatarPrimitive.Fallback>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>>(
        ({ className, ...props }, ref) => {
            return (
                <AvatarPrimitive.Fallback
                    ref={ref}
                    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
                    {...props}
                />
            );
        }
    )
);
Fallback.displayName = AvatarPrimitive.Fallback.displayName;

export default {
    Variants,
    Fallback,
    Image,
    Root,
};
