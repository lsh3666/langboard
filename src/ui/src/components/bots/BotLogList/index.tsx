import { Box, Flex, Loading, ScrollArea } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import { BotLogModel, BotModel, Project, ProjectCard, ProjectColumn } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { useCallback, useMemo, useRef } from "react";
import useGetBotLogs from "@/controllers/api/shared/botLogs/useGetBotLogs";
import { TBotLogRelatedParams } from "@/controllers/api/shared/botLogs/types";
import { BotLogListProvider } from "@/components/bots/BotLogList/Provider";
import BotLogListItem from "@/components/bots/BotLogList/Item";
import { useTranslation } from "react-i18next";

export interface IBotLogListProps {
    bot: BotModel.TModel;
    params: TBotLogRelatedParams;
    target: Project.TModel | ProjectColumn.TModel | ProjectCard.TModel;
}

function BotLogList({ bot, params, target }: IBotLogListProps) {
    const [t] = useTranslation();
    const { mutateAsync, isLastPage, isFetchingRef } = useGetBotLogs(bot.uid, { ...params, target_uid: target.uid });
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const flatLogs = BotLogModel.Model.useModels(
        (model) => model.bot_uid === bot.uid && model.filterable_table === params.target_table && model.filterable_uid === target.uid
    );
    const logs = useMemo(() => flatLogs.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime()), [flatLogs]);
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
        <BotLogListProvider bot={bot} params={params} target={target}>
            <Flex direction="col" gap="2">
                <ScrollArea.Root viewportRef={viewportRef} mutable={logs}>
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
                        <Box display={{ initial: "flex", sm: "grid" }} direction="col" gap="2">
                            {logs.map((log) => (
                                <BotLogListItem key={log.uid} log={log} />
                            ))}
                        </Box>
                    </InfiniteScroller.NoVirtual>
                </ScrollArea.Root>
                {!logs.length && (
                    <Box w="full" className="text-center">
                        {t("bot.No logs found")}
                    </Box>
                )}
            </Flex>
        </BotLogListProvider>
    );
}

export default BotLogList;
