/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { McpToolGroup } from "@/core/models";

const useDeactivateMcpToolGroup = (toolGroup: McpToolGroup.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deactivateMcpToolGroup = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.MCP_TOOL_GROUPS.DEACTIVATE, { group_uid: toolGroup.uid });
        const res = await api.put(
            url,
            {},
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        toolGroup.activated_at = undefined;

        return res.data;
    };

    const result = mutate(["deactivate-mcp-tool-group"], deactivateMcpToolGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeactivateMcpToolGroup;
