import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectBotScope, ProjectCardBotScope, ProjectColumnBotScope } from "@/core/models";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotScopeDeletedRawResponse {
    scope_table: TBotRelatedTargetTable;
    uid: string;
    conditions: string[];
}

export interface IUseBoardBotScopeDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotScopeDeletedHandlers = ({ callback, projectUID }: IUseBoardBotScopeDeletedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotScopeDeletedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-scope-deleted-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.SCOPE.DELETED,
            callback,
            responseConverter: (data) => {
                if (data.scope_table === "project") {
                    ProjectBotScope.Model.deleteModel(data.uid);
                } else if (data.scope_table === "project_column") {
                    ProjectColumnBotScope.Model.deleteModel(data.uid);
                } else if (data.scope_table === "card") {
                    ProjectCardBotScope.Model.deleteModel(data.uid);
                }

                return {};
            },
        },
    });
};

export default useBoardBotScopeDeletedHandlers;
