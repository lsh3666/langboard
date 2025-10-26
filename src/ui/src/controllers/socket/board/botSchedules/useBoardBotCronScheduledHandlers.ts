import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BaseBotScheduleModel, ProjectBotSchedule, ProjectCardBotSchedule, ProjectColumnBotSchedule } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";

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
                if (data.target_table === "project") {
                    ProjectBotSchedule.Model.fromOne(data.schedule, true);
                } else if (data.target_table === "project_column") {
                    ProjectColumnBotSchedule.Model.fromOne(data.schedule, true);
                } else if (data.target_table === "card") {
                    ProjectCardBotSchedule.Model.fromOne(data.schedule, true);
                }
                return {};
            },
        },
    });
};

export default useBoardBotCronScheduledHandlers;
