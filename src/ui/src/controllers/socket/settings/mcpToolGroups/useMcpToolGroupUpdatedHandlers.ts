import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { McpToolGroup } from "@/core/models";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface IMcpToolGroupUpdatedRawResponse {
    name?: string;
    description?: string;
    tools?: string[];
    activated_at?: Date;
}

export interface IUseMcpToolGroupUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    toolGroup: McpToolGroup.TModel;
}

const useMcpToolGroupUpdatedHandlers = ({ callback, toolGroup }: IUseMcpToolGroupUpdatedHandlersProps) => {
    return useSocketHandler<{}, IMcpToolGroupUpdatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: `mcp-tool-group-updated-${toolGroup.uid}`,
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.MCP_TOOL_GROUP.UPDATED,
            params: { uid: toolGroup.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    toolGroup[key] = value as never;
                });

                return {};
            },
        },
    });
};

export default useMcpToolGroupUpdatedHandlers;
