import Box, { TBoxProps } from "@/components/base/Box";
import Flex, { IFlexProps } from "@/components/base/Flex";
import { cn } from "@/core/utils/ComponentUtils";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { tv, VariantProps } from "tailwind-variants";

export const LoadingVariants = tv(
    {
        variants: {
            isMenu: {
                true: "w-full cursor-pointer justify-start gap-1",
            },
            variant: {
                primary: "bg-primary",
                destructive: "bg-destructive",
                secondary: "bg-secondary",
                "primary-foreground": "bg-primary-foreground",
                none: "",
            },
            spacing: {
                "0": "space-x-0",
                "0.5": "space-x-0.5",
                "1": "space-x-1",
                "1.5": "space-x-1.5",
                "2": "space-x-2",
                "2.5": "space-x-2.5",
                "3": "space-x-3",
                "3.5": "space-x-3.5",
                "4": "space-x-4",
                "5": "space-x-5",
                none: "",
            },
            animate: {
                bounce: "animate-bounce",
                pulse: "animate-pulse",
                none: "",
            },
        },
        defaultVariants: {
            variant: "primary-foreground",
            spacing: "1",
            animate: "bounce",
        },
    },
    {
        responsiveVariants: true,
    }
);

export interface ILoadingProps extends IFlexProps, VariantProps<typeof LoadingVariants>, Pick<TBoxProps, "size"> {}

const Loading = forwardRef<HTMLDivElement, ILoadingProps>(({ size = "3", variant, spacing, animate, className, children, ...props }, ref) => {
    const [t] = useTranslation();

    return (
        <Flex justify="center" className={LoadingVariants({ spacing, variant: "none", animate: "none" })} ref={ref} {...props}>
            <span className="sr-only">{t("editor.Loading...")}</span>
            <Box
                size={size}
                rounded="full"
                className={cn("!ml-0 animate-bounce [animation-delay:-0.3s]", LoadingVariants({ spacing: "none", variant, animate }))}
            />
            <Box
                size={size}
                rounded="full"
                className={cn("animate-bounce [animation-delay:-0.15s]", LoadingVariants({ spacing: "none", variant, animate }))}
            />
            <Box size={size} rounded="full" className={cn("animate-bounce", LoadingVariants({ spacing: "none", variant, animate }))} />
        </Flex>
    );
});

export default Loading;
