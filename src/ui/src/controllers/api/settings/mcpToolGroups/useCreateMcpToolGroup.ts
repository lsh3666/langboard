import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { McpToolGroup } from "@/core/models";

export interface ICreateMcpToolGroupForm {
    name: string;
    description: string;
    tools: string[];
    activate: bool;
    is_global: bool;
}

const useCreateMcpToolGroup = (options?: TMutationOptions<ICreateMcpToolGroupForm>) => {
    const { mutate } = useQueryMutation();

    const createMcpToolGroup = async (params: ICreateMcpToolGroupForm) => {
        const res = await api.post(Routing.API.SETTINGS.MCP_TOOL_GROUPS.CREATE, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        McpToolGroup.Model.fromOne(res.data.tool_group, true);

        return {};
    };

    const result = mutate(["create-mcp-tool-group"], createMcpToolGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateMcpToolGroup;
