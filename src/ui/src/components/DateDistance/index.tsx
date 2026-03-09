import Tooltip from "@/components/base/Tooltip";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { Utils } from "@langboard/core/utils";

export type TDateDistanceProps = {
    date: Date;
    tooltipRootProps?: React.ComponentPropsWithoutRef<typeof Tooltip.Root>;
    tooltipContentProps?: React.ComponentPropsWithoutRef<typeof Tooltip.Content>;
} & React.ComponentPropsWithoutRef<"span">;

const DateDistance = ({ date, tooltipRootProps, tooltipContentProps, ...props }: TDateDistanceProps): React.JSX.Element => {
    const rawDateString = Utils.String.formatDateLocale(date);
    const distance = useUpdateDateDistance(date);

    return (
        <Tooltip.Root {...tooltipRootProps}>
            <Tooltip.Trigger asChild>
                <span {...props}>{distance}</span>
            </Tooltip.Trigger>
            <Tooltip.Content {...tooltipContentProps}>{rawDateString}</Tooltip.Content>
        </Tooltip.Root>
    );
};

export default DateDistance;
