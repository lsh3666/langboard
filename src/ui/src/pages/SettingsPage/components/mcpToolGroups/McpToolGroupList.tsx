import { useEffect, useState } from "react";
import useGetMcpToolGroups from "@/controllers/api/settings/mcpToolGroups/useGetMcpToolGroups";
import { McpToolGroup } from "@/core/models";
import { Box, Flex, PillList } from "@/components/base";
import McpToolGroupListItem from "@/pages/SettingsPage/components/mcpToolGroups/McpToolGroupListItem";
import McpToolGroupDetails from "@/pages/SettingsPage/components/mcpToolGroups/McpToolGroupDetails";
import { ModelRegistry } from "@/core/models/ModelRegistry";

export interface IMcpToolGroupListProps {
    type: McpToolGroup.TGroupType;
    selectedGroups: string[];
    setSelectedGroups: React.Dispatch<React.SetStateAction<string[]>>;
}

function McpToolGroupList({ type, selectedGroups, setSelectedGroups }: IMcpToolGroupListProps) {
    const { mutateAsync } = useGetMcpToolGroups();
    const toolGroups = McpToolGroup.Model.useModels((model) => (type === "admin" ? !!model.user_uid : !model.user_uid), [type]);
    const [viewGroupUID, setViewGroupUID] = useState<string>();

    useEffect(() => {
        mutateAsync({ type });
        setSelectedGroups([]);
        setViewGroupUID(undefined);
    }, [type]);

    return (
        <Flex gap="2">
            <PillList.Root className="w-1/2 overflow-y-auto pt-3">
                {toolGroups.map((toolGroup) => (
                    <ModelRegistry.McpToolGroup.Provider
                        key={toolGroup.uid}
                        model={toolGroup}
                        params={{ viewGroupUID, setViewGroupUID, selectedGroups, setSelectedGroups }}
                    >
                        <McpToolGroupListItem />
                    </ModelRegistry.McpToolGroup.Provider>
                ))}
            </PillList.Root>
            <Box pt="3" className="w-1/2">
                <McpToolGroupDetails toolGroupUID={viewGroupUID} />
            </Box>
        </Flex>
    );
}

export default McpToolGroupList;
