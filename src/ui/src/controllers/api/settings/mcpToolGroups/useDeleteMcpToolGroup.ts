/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { McpToolGroup } from "@/core/models";

const useDeleteMcpToolGroup = (toolGroup: McpToolGroup.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deleteMcpToolGroup = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.MCP_TOOL_GROUPS.DELETE, { group_uid: toolGroup.uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        McpToolGroup.Model.deleteModel(toolGroup.uid);

        return res.data;
    };

    const result = mutate(["delete-mcp-tool-group"], deleteMcpToolGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteMcpToolGroup;
