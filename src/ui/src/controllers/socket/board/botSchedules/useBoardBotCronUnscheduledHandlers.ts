import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { TBotRelatedTargetTable } from "@/core/models/types/bot.related.type";
import { ESocketTopic } from "@langboard/core/enums";
import { BOT_SCHEDULES } from "@/core/constants/BotRelatedConstants";

export interface IBoardBotCronUnscheduledRawResponse {
    target_table: TBotRelatedTargetTable;
    uid: string;
}

export interface IUseBoardBotCronUnscheduledHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotCronUnscheduledHandlers = ({ callback, projectUID }: IUseBoardBotCronUnscheduledHandlersProps) => {
    return useSocketHandler<{}, IBoardBotCronUnscheduledRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-cron-unscheduled-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.SCHEDULE.UNSCHEDULED,
            callback,
            responseConverter: (data) => {
                const targetModel = BOT_SCHEDULES[data.target_table];
                if (targetModel) {
                    targetModel.Model.deleteModel(data.uid);
                }

                return {};
            },
        },
    });
};

export default useBoardBotCronUnscheduledHandlers;
