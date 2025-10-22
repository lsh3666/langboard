/* eslint-disable @typescript-eslint/no-explicit-any */
import { TBotScheduleRelatedParams } from "@/controllers/api/shared/botSchedules/types";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCardBotSchedule, ProjectColumnBotSchedule, ProjectCard, ProjectColumn } from "@/core/models";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";
import { Utils } from "@langboard/core/utils";
import { useEffect, useRef, useState } from "react";

export type TUseGetBotSchedulesForm = TBotScheduleRelatedParams & {
    target_uid: string;
};

const useGetBotSchedules = (botUID: string, params: TUseGetBotSchedulesForm, limit: number = 20, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();
    const [isLastPage, setIsLastPage] = useState(true);
    const isFetchingRef = useRef(false);
    const lastCurrentDateRef = useRef(new Date());
    const pageRef = useRef(0);

    let url;
    switch (params.target_table) {
        case "project_column":
            url = Utils.String.format(Routing.API.BOARD.BOT.SCHEDULE.GET_ALL_BY_COLUMN, {
                uid: params.project_uid,
                bot_uid: botUID,
                project_column_uid: params.target_uid,
            });
            break;
        case "card":
            url = Utils.String.format(Routing.API.BOARD.BOT.SCHEDULE.GET_ALL_BY_CARD, {
                uid: params.project_uid,
                bot_uid: botUID,
                card_uid: params.target_uid,
            });
            break;
        default:
            throw new Error("Invalid target_table");
    }

    const getBotSchedules = async () => {
        if ((isLastPage && pageRef.current) || isFetchingRef.current) {
            return {};
        }

        isFetchingRef.current = true;

        ++pageRef.current;

        const res = await api.get(url, {
            params: {
                bot_uid: botUID,
                refer_time: lastCurrentDateRef.current,
                page: pageRef.current,
                limit,
            },
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        switch (params.target_table as TBotRelatedTargetTable) {
            case "project_column":
                ProjectColumn.Model.fromOne(res.data.target);
                ProjectColumnBotSchedule.Model.fromArray(res.data.schedules, true);
                break;
            case "card":
                ProjectCard.Model.fromOne(res.data.target);
                ProjectCardBotSchedule.Model.fromArray(res.data.schedules, true);
                break;
        }

        setIsLastPage(res.data.schedules.length < limit);

        isFetchingRef.current = false;

        return {};
    };

    useEffect(() => {
        if (pageRef.current) {
            return;
        }

        lastCurrentDateRef.current = new Date();
        setTimeout(() => {
            getBotSchedules();
        }, 0);

        return () => {
            pageRef.current = 0;
        };
    }, []);

    const result = mutate(["get-bot-schedules"], getBotSchedules, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage, isFetchingRef };
};

export default useGetBotSchedules;
