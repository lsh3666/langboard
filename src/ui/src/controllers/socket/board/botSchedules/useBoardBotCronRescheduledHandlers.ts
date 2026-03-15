import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BaseBotScheduleModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";
import { TBotRelatedTargetTable } from "@/core/models/types/bot.related.type";
import { BOT_SCHEDULES } from "@/core/constants/BotRelatedConstants";

export interface TBoardBotCronRescheduledRawResponse {
    target_table: TBotRelatedTargetTable;
    uid: string;
    updated: Partial<Omit<BaseBotScheduleModel.Interface, "uid">>;
}

export interface IUseBoardBotCronRescheduledHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotCronRescheduledHandlers = ({ callback, projectUID }: IUseBoardBotCronRescheduledHandlersProps) => {
    return useSocketHandler<{}, TBoardBotCronRescheduledRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-cron-rescheduled-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.SCHEDULE.RESCHEDULED,
            callback,
            responseConverter: (data) => {
                let model;
                const targetModel = BOT_SCHEDULES[data.target_table];
                if (targetModel) {
                    model = targetModel.Model.getModel(data.uid);
                }

                if (model) {
                    Object.entries(data.updated).forEach(([key, value]) => {
                        model[key] = value;
                    });
                }

                return {};
            },
        },
    });
};

export default useBoardBotCronRescheduledHandlers;
