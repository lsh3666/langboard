import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { McpToolGroup } from "@/core/models";
import { ESocketTopic, ESettingSocketTopicID } from "@langboard/core/enums";

export interface IUseMcpToolGroupDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    toolGroup: McpToolGroup.TModel;
}

const useMcpToolGroupDeletedHandlers = ({ callback, toolGroup }: IUseMcpToolGroupDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.AppSettings,
        topicId: ESettingSocketTopicID.McpToolGroup,
        eventKey: `mcp-tool-group-deleted-${toolGroup.uid}`,
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.MCP_TOOL_GROUP.DELETED,
            params: { uid: toolGroup.uid },
            callback,
            responseConverter: () => {
                McpToolGroup.Model.deleteModel(toolGroup.uid);

                return {};
            },
        },
    });
};

export default useMcpToolGroupDeletedHandlers;
