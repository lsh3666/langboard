import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AppSettingModel } from "@/core/models";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface IUseMcpToolGroupDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    toolGroup: AppSettingModel.TModel;
}

const useMcpToolGroupDeletedHandlers = ({ callback, toolGroup }: IUseMcpToolGroupDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: `mcp-tool-group-deleted-${toolGroup.uid}`,
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.MCP_TOOL_GROUP.DELETED,
            params: { uid: toolGroup.uid },
            callback,
            responseConverter: () => {
                AppSettingModel.Model.deleteModel(toolGroup.uid);

                return {};
            },
        },
    });
};

export default useMcpToolGroupDeletedHandlers;
