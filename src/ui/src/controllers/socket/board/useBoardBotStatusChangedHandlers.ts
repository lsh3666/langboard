import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { getBotStatusStore } from "@/core/stores/BotStatusStore";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotStatusChangedRawResponse {
    bot_uid: string;
    project_column_uid?: string;
    card_uid?: string;
    status: "running" | "stopped";
}

export interface IUseBoardBotStatusChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotStatusChangedHandlers = ({ callback, projectUID }: IUseBoardBotStatusChangedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotStatusChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-bot-status-changed-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.STATUS_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                getBotStatusStore().updateBotStatus({
                    type: data.card_uid ? "card" : "project_column",
                    botUID: data.bot_uid,
                    targetUID: data.card_uid || data.project_column_uid!,
                    status: data.status,
                });

                return data;
            },
        },
    });
};

export default useBoardBotStatusChangedHandlers;
