/* eslint-disable @typescript-eslint/no-explicit-any */
import { TBotScheduleRelatedParams } from "@/controllers/api/shared/botSchedules/types";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCardBotSchedule, ProjectColumnBotSchedule } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export type TUnscheduleBotCronParams = TBotScheduleRelatedParams & {
    schedule_uid: string;
};

const useUnscheduleBotCron = (params: TUnscheduleBotCronParams, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const unscheduleBotCron = async () => {
        let url;
        switch (params.target_table) {
            case "project_column":
            case "card":
                url = Utils.String.format(Routing.API.BOT.SCHEDULE.UNSCHEDULE, {
                    bot_uid: params.bot_uid,
                    schedule_uid: params.schedule_uid,
                });
                break;
            default:
                throw new Error("Invalid target_table");
        }

        const res = await api.delete(url, {
            data: {
                target_table: params.target_table,
            },
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        switch (params.target_table) {
            case "project_column":
                ProjectColumnBotSchedule.Model.deleteModel(params.schedule_uid);
                break;
            case "card":
                ProjectCardBotSchedule.Model.deleteModel(params.schedule_uid);
                break;
        }

        return res.data;
    };

    const result = mutate(["unschedule-bot-cron"], unscheduleBotCron, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUnscheduleBotCron;
