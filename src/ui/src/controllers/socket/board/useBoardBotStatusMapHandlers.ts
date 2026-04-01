import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { getBotStatusStore, IBotStatusStore } from "@/core/stores/BotStatusStore";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotStatusMapRawResponse {
    bot_status_map: IBotStatusStore["botStatusMap"];
}

export interface IUseBoardBotStatusMapHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotStatusMapHandlers = ({ callback, projectUID }: IUseBoardBotStatusMapHandlersProps) => {
    return useSocketHandler<{}, IBoardBotStatusMapRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: "get-bot-status-map",
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.STATUS_MAP,
            callback,
            responseConverter: (data) => {
                if (!data?.bot_status_map) {
                    return data;
                }

                getBotStatusStore().replaceMap(data.bot_status_map);
                return data;
            },
        },
        sendProps: {
            name: SocketEvents.CLIENT.BOARD.BOT.STATUS_MAP,
        },
    });
};

export default useBoardBotStatusMapHandlers;
