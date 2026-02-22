import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { TBotRelatedTargetTable } from "@/core/models/types/bot.related.type";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardUIBotScopeConditionsUpdatedRawResponse {
    scope_table: TBotRelatedTargetTable;
    uid: string;
    conditions: string[];
}

export interface IUseBoardUIBotScopeConditionsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardUIBotScopeConditionsUpdatedHandlers = ({ callback, projectUID }: IUseBoardUIBotScopeConditionsUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBoardUIBotScopeConditionsUpdatedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-ui-bot-scope-trigger-conditions-updated-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.SCOPE.TRIGGER_CONDITION_TOGGLED,
            callback,
        },
    });
};

export default useBoardUIBotScopeConditionsUpdatedHandlers;
