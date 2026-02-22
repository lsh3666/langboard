/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { McpToolGroup } from "@/core/models";

export interface IDeleteSelectedMcpToolGroupsForm {
    group_uids: string[];
}

const useDeleteSelectedMcpToolGroups = (options?: TMutationOptions<IDeleteSelectedMcpToolGroupsForm>) => {
    const { mutate } = useQueryMutation();

    const deleteSelectedMcpToolGroups = async (params: IDeleteSelectedMcpToolGroupsForm) => {
        const res = await api.delete(Routing.API.SETTINGS.MCP_TOOL_GROUPS.DELETE_SELECTED, {
            data: params,
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        McpToolGroup.Model.deleteModels(params.group_uids);

        return res.data;
    };

    const result = mutate(["delete-selected-mcp-tool-groups"], deleteSelectedMcpToolGroups, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSelectedMcpToolGroups;
