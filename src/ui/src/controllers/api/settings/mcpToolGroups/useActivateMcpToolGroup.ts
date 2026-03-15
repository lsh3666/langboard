import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { McpToolGroup } from "@/core/models";

const useActivateMcpToolGroup = (toolGroup: McpToolGroup.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const activateMcpToolGroup = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.MCP_TOOL_GROUPS.ACTIVATE, { group_uid: toolGroup.uid });
        const res = await api.put(
            url,
            {},
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        toolGroup.activated_at = res.data.activated_at;

        return res.data;
    };

    const result = mutate(["activate-mcp-tool-group"], activateMcpToolGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useActivateMcpToolGroup;
