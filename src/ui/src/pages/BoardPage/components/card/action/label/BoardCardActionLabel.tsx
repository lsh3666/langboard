import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import Tooltip from "@/components/base/Tooltip";
import { ProjectLabel } from "@/core/models";
import { memo } from "react";

export interface IBoardCardActionLabelProps {
    label: ProjectLabel.TModel;
}

const BoardCardActionLabel = memo(({ label }: IBoardCardActionLabelProps) => {
    const name = label.useField("name");
    const color = label.useField("color");
    const description = label.useField("description");

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <Flex items="center" gap="1.5" className="truncate">
                    <Box
                        minH="6"
                        minW="6"
                        rounded="md"
                        style={{
                            backgroundColor: color || "#FFFFFF",
                        }}
                    />
                    <Box className="truncate">{name}</Box>
                </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content align="center">{description}</Tooltip.Content>
        </Tooltip.Root>
    );
});

export default BoardCardActionLabel;
