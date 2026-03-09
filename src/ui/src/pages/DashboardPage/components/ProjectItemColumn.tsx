import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import Tooltip from "@/components/base/Tooltip";
import { ProjectColumn } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IProjectCardColumnProps {
    column: ProjectColumn.TModel;
}

function ProjectCardColumn({ column }: IProjectCardColumnProps) {
    const name = column.useField("name");
    const count = column.useField("count");

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <Flex direction="col" gap="0.5" minW="5" className="text-center">
                    <span className="text-sm font-semibold">{count}</span>
                    <Box
                        display="inline-block"
                        h="0.5"
                        w="full"
                        rounded="full"
                        style={{ background: new Utils.Color.Generator(name).generateRandomColor() }}
                    />
                </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">{name}</Tooltip.Content>
        </Tooltip.Root>
    );
}

export default ProjectCardColumn;
