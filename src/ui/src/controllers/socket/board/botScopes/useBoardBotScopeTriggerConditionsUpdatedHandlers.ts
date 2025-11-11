import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectBotScope, ProjectCardBotScope, ProjectColumnBotScope } from "@/core/models";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";
import { EBotTriggerCondition } from "@/core/models/botScopes/EBotTriggerCondition";
import { ESocketTopic } from "@langboard/core/enums";
import { Utils } from "@langboard/core/utils";

export interface IBoardBotScopeConditionsUpdatedRawResponse {
    scope_table: TBotRelatedTargetTable;
    uid: string;
    conditions: string[];
}

export interface IUseBoardBotScopeConditionsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotScopeConditionsUpdatedHandlers = ({ callback, projectUID }: IUseBoardBotScopeConditionsUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotScopeConditionsUpdatedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-scope-trigger-conditions-updated-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.SCOPE.TRIGGER_CONDITION_TOGGLED,
            callback,
            responseConverter: (data) => {
                let model;
                if (data.scope_table === "project") {
                    model = ProjectBotScope.Model.getModel(data.uid);
                } else if (data.scope_table === "project_column") {
                    model = ProjectColumnBotScope.Model.getModel(data.uid);
                } else if (data.scope_table === "card") {
                    model = ProjectCardBotScope.Model.getModel(data.uid);
                }

                if (model) {
                    model.conditions = data.conditions.map((condition) => {
                        return Utils.String.convertSafeEnum(EBotTriggerCondition, condition);
                    });
                }

                return {};
            },
        },
    });
};

export default useBoardBotScopeConditionsUpdatedHandlers;
