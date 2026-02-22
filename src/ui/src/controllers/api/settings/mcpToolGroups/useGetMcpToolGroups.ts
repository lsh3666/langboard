/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { McpToolGroup } from "@/core/models";

export interface IGetMcpToolGroupsForm {
    type: McpToolGroup.TGroupType;
}

const useGetMcpToolGroups = (options?: TMutationOptions<IGetMcpToolGroupsForm>) => {
    const { mutate } = useQueryMutation();

    const getMcpToolGroups = async (params: IGetMcpToolGroupsForm) => {
        const url =
            params.type === "admin" ? Routing.API.SETTINGS.MCP_TOOL_GROUPS.GET_ADMIN_LIST : Routing.API.SETTINGS.MCP_TOOL_GROUPS.GET_GLOBAL_LIST;
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        McpToolGroup.Model.fromArray(res.data.tool_groups, true);

        return res.data;
    };

    const result = mutate(["get-mcp-tool-groups"], getMcpToolGroups, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetMcpToolGroups;
