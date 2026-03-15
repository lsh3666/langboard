import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BaseBotScheduleModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";
import { TBotRelatedTargetTable } from "@/core/models/types/bot.related.type";
import { BOT_SCHEDULES } from "@/core/constants/BotRelatedConstants";

export interface IBoardBotCronScheduledRawResponse {
    target_table: TBotRelatedTargetTable;
    schedule: BaseBotScheduleModel.Interface;
}

export interface IUseBoardBotCronScheduledHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotCronScheduledHandlers = ({ callback, projectUID }: IUseBoardBotCronScheduledHandlersProps) => {
    return useSocketHandler<{}, IBoardBotCronScheduledRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-cron-scheduled-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.SCHEDULE.SCHEDULED,
            callback,
            responseConverter: (data) => {
                const targetModel = BOT_SCHEDULES[data.target_table];
                if (targetModel) {
                    targetModel.Model.fromOne(data.schedule, true);
                }
                return {};
            },
        },
    });
};

export default useBoardBotCronScheduledHandlers;
