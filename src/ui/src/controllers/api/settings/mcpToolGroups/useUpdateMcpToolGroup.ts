import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { McpToolGroup } from "@/core/models";

export interface IUpdateMcpToolGroupForm {
    name?: string;
    description?: string;
    tools?: string[];
}

const useUpdateMcpToolGroup = (toolGroup: McpToolGroup.TModel, options?: TMutationOptions<IUpdateMcpToolGroupForm>) => {
    const { mutate } = useQueryMutation();

    const updateMcpToolGroup = async (params: IUpdateMcpToolGroupForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.MCP_TOOL_GROUPS.UPDATE, { group_uid: toolGroup.uid });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        McpToolGroup.Model.fromOne(res.data.tool_group, true);

        return res.data;
    };

    const result = mutate(["update-mcp-tool-group"], updateMcpToolGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateMcpToolGroup;
