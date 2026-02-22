/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { getMcpToolStore, TMcpTool } from "@/core/stores/McpToolStore";

export interface IGetMcpToolListResponse {
    tools: Record<string, TMcpTool>;
}

const useGetMcpToolList = (options?: TMutationOptions<{}, IGetMcpToolListResponse>) => {
    const { mutate } = useQueryMutation();

    const getMcpToolList = async () => {
        const res = await api.get(Routing.API.MCP.GET_TOOL_LIST, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        getMcpToolStore().replaceTools(res.data.tools);

        return res.data;
    };

    const result = mutate(["get-mcp-tool-list"], getMcpToolList, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetMcpToolList;
