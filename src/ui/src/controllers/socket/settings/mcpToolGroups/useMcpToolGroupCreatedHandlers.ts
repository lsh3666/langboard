import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { McpToolGroup } from "@/core/models";
import { ESocketTopic, ESettingSocketTopicID } from "@langboard/core/enums";

export interface IMcpToolGroupCreatedRawResponse {
    tool_group: McpToolGroup.Interface;
}

const useMcpToolGroupCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IMcpToolGroupCreatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: ESettingSocketTopicID.McpToolGroup,
        eventKey: "mcp-tool-group-created",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.MCP_TOOL_GROUP.CREATED,
            callback,
            responseConverter: (data) => {
                McpToolGroup.Model.fromOne(data.tool_group, true);
                return {};
            },
        },
    });
};

export default useMcpToolGroupCreatedHandlers;
