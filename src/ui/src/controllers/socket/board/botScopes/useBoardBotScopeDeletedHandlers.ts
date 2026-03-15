import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { TBotRelatedTargetTable } from "@/core/models/types/bot.related.type";
import { ESocketTopic } from "@langboard/core/enums";
import { BOT_SCOPES } from "@/core/constants/BotRelatedConstants";

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
                const targetModel = BOT_SCOPES[data.scope_table];
                if (targetModel) {
                    targetModel.Model.deleteModel(data.uid);
                }

                return {};
            },
        },
    });
};

export default useBoardBotScopeDeletedHandlers;
