import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectBotSchedule, ProjectCardBotSchedule, ProjectColumnBotSchedule } from "@/core/models";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";
import { ESocketTopic } from "@langboard/core/enums";

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
                if (data.target_table === "project") {
                    ProjectBotSchedule.Model.deleteModel(data.uid);
                } else if (data.target_table === "project_column") {
                    ProjectColumnBotSchedule.Model.deleteModel(data.uid);
                } else if (data.target_table === "card") {
                    ProjectCardBotSchedule.Model.deleteModel(data.uid);
                }

                return {};
            },
        },
    });
};

export default useBoardBotCronUnscheduledHandlers;
