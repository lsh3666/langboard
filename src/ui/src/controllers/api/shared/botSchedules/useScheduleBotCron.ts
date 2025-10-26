/* eslint-disable @typescript-eslint/no-explicit-any */
import { TBotScheduleRelatedParams } from "@/controllers/api/shared/botSchedules/types";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BaseBotScheduleModel, ProjectCard, ProjectColumn } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IScheduleBotCronForm {
    scope: ProjectColumn.TModel | ProjectCard.TModel;
    interval: string;
    running_type?: BaseBotScheduleModel.ERunningType;
    start_at?: Date;
    end_at?: Date;
}

const useScheduleBotCron = (params: TBotScheduleRelatedParams, options?: TMutationOptions<IScheduleBotCronForm>) => {
    const { mutate } = useQueryMutation();

    let url;
    switch (params.target_table) {
        case "project_column":
        case "card":
            url = Utils.String.format(Routing.API.BOT.SCHEDULE.SCHEDULE, {
                bot_uid: params.bot_uid,
            });
            break;
        default:
            throw new Error("Invalid target_table");
    }

    const scheduleBotCron = async (form: IScheduleBotCronForm) => {
        const res = await api.post(
            url,
            {
                interval_str: form.interval,
                target_table: params.target_table,
                target_uid: form.scope.uid,
                running_type: form.running_type,
                start_at: form.start_at,
                end_at: form.end_at,
                timezone: new Date().getTimezoneOffset() / -60,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["schedule-bot-cron"], scheduleBotCron, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useScheduleBotCron;
