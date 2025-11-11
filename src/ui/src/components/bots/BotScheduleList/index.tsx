import { Box, Flex, Loading, ScrollArea } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import { BotModel, Project, ProjectCard, ProjectCardBotSchedule, ProjectColumn, ProjectColumnBotSchedule } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { useCallback, useRef } from "react";
import BotScheduleListItemAddButton from "@/components/bots/BotScheduleList/ItemAddButton";
import BotScheduleListItem from "@/components/bots/BotScheduleList/Item";
import useGetBotSchedules from "@/controllers/api/shared/botSchedules/useGetBotSchedules";
import { TBotScheduleRelatedParams } from "@/controllers/api/shared/botSchedules/types";
import { BotScheduleListProvider } from "@/components/bots/BotScheduleList/Provider";
import { TPickedModelClass, TBotScheduleModelName, TBotScheduleModel } from "@/core/models/ModelRegistry";

export interface IBotScheduleListProps {
    bot: BotModel.TModel;
    params: TBotScheduleRelatedParams;
    target: Project.TModel | ProjectColumn.TModel | ProjectCard.TModel;
}

function BotScheduleList({ params, ...props }: IBotScheduleListProps) {
    let scheduleModel;
    let filterModel;
    switch (params.target_table) {
        case "project_column":
            scheduleModel = ProjectColumnBotSchedule.Model;
            filterModel = (model: ProjectColumnBotSchedule.TModel) => model.project_column_uid === props.target.uid;
            break;
        case "card":
            scheduleModel = ProjectCardBotSchedule.Model;
            filterModel = (model: ProjectCardBotSchedule.TModel) => model.card_uid === props.target.uid;
            break;
        default:
            return <></>;
    }

    return (
        <BotScheduleListDisplay
            {...props}
            params={params}
            ScheduleModel={scheduleModel}
            filterModel={filterModel as (model: TBotScheduleModel<TBotScheduleModelName>) => bool}
        />
    );
}

interface IBotScheduleListDisplayProps extends IBotScheduleListProps {
    ScheduleModel: TPickedModelClass<TBotScheduleModelName>;
    filterModel: (model: TBotScheduleModel<TBotScheduleModelName>) => bool;
}

function BotScheduleListDisplay({ bot, params, target, ScheduleModel, filterModel }: IBotScheduleListDisplayProps): JSX.Element {
    const { mutateAsync, isLastPage, isFetchingRef } = useGetBotSchedules(bot.uid, { ...params, target_uid: target.uid });
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const schedules = ScheduleModel.useModels((model) => model.bot_uid === bot.uid && filterModel(model));
    const nextPage = useCallback(async () => {
        if (isFetchingRef.current || isLastPage) {
            return false;
        }

        return await new Promise<bool>((resolve) => {
            setTimeout(async () => {
                await mutateAsync({});
                resolve(true);
            }, 1000);
        });
    }, [isLastPage, mutateAsync]);

    return (
        <BotScheduleListProvider bot={bot} params={params} target={target}>
            <Flex direction="col" gap="2">
                <ScrollArea.Root viewportRef={viewportRef} mutable={schedules}>
                    <InfiniteScroller.NoVirtual
                        scrollable={() => viewportRef.current}
                        loadMore={nextPage}
                        hasMore={!isLastPage}
                        loader={
                            <Flex justify="center" mt="6" key={Utils.String.Token.shortUUID()}>
                                <Loading size="3" variant="secondary" />
                            </Flex>
                        }
                        className="max-h-[calc(70vh_-_theme(spacing.20)_-_theme(spacing.1))]"
                    >
                        <Box display={{ initial: "flex", sm: "grid" }} direction="col" gap="2" className="sm:grid-cols-2">
                            {schedules.map((schedule) => (
                                <BotScheduleListItem key={schedule.uid} schedule={schedule} />
                            ))}
                        </Box>
                    </InfiniteScroller.NoVirtual>
                </ScrollArea.Root>
                <BotScheduleListItemAddButton />
            </Flex>
        </BotScheduleListProvider>
    );
}

export default BotScheduleList;
