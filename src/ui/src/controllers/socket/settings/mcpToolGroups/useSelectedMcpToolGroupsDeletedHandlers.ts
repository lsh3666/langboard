import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { McpToolGroup } from "@/core/models";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface ISelectedMcpToolGroupsDeletedRawResponse {
    uids: string[];
}

const useSelectedMcpToolGroupsDeletedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, ISelectedMcpToolGroupsDeletedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "selected-mcp-tool-groups-deleted",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.MCP_TOOL_GROUP.SELECTIONS_DELETED,
            callback,
            responseConverter: (data) => {
                McpToolGroup.Model.deleteModels(data.uids);

                return {};
            },
        },
    });
};

export default useSelectedMcpToolGroupsDeletedHandlers;
