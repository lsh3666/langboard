import { Flex } from "@/components/base";
import useChangeWikiOrder from "@/controllers/api/wiki/useChangeWikiOrder";
import { singleDndHelpers } from "@/core/helpers/dnd";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnReordered from "@/core/hooks/useColumnReordered";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import WikiTab, { SkeletonWikiTab } from "@/pages/BoardPage/components/wiki/WikiTab";
import { BOARD_WIKI_DND_SYMBOL_SET } from "@/pages/BoardPage/components/wiki/WikiConstants";
import { memo, useEffect, useMemo, useReducer } from "react";

export function SkeletonWikiTabList() {
    return (
        <Flex justify="center" items="center" gap="1" inline h="10" p="1">
            <SkeletonWikiTab />
            <SkeletonWikiTab />
            <SkeletonWikiTab />
        </Flex>
    );
}

const WikiTabList = memo(() => {
    const { project, wikis: flatWikis, socket, modeType } = useBoardWiki();
    const wikisMap = useMemo<Record<string, ProjectWiki.TModel>>(() => {
        const map: Record<string, ProjectWiki.TModel> = {};
        flatWikis.forEach((wiki) => {
            map[wiki.uid] = wiki;
        });
        return map;
    }, [flatWikis]);
    const updater = useReducer((x) => x + 1, 0);
    const { mutate: changeWikiOrderMutate } = useChangeWikiOrder();
    const { columns: wikis } = useColumnReordered({
        type: "ProjectWiki",
        topicId: project.uid,
        eventNameParams: { uid: project.uid },
        columns: flatWikis,
        socket,
        updater,
    });

    useEffect(() => {
        if (modeType !== "reorder") {
            return;
        }

        const setupApiErrors = (error: unknown, undo: () => void) => {
            const { handle } = setupApiErrorHandler({
                code: {
                    after: undo,
                },
                wildcard: {
                    after: undo,
                },
            });

            handle(error);
        };

        return singleDndHelpers.root({
            rowsMap: wikisMap,
            symbolSet: BOARD_WIKI_DND_SYMBOL_SET,
            isHorizontal: true,
            changeOrder: ({ rowUID, order, undo }) => {
                changeWikiOrderMutate(
                    { project_uid: project.uid, wiki_uid: rowUID, order },
                    {
                        onError: (error) => setupApiErrors(error, undo),
                    }
                );
            },
        });
    }, [flatWikis, wikisMap, modeType]);

    return wikis.map((wiki) => <WikiTab key={`board-wiki-${wiki.uid}-tab`} wiki={wiki} />);
});

export default WikiTabList;
