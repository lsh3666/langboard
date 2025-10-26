import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectBotScope, ProjectCardBotScope, ProjectColumnBotScope } from "@/core/models";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotScopeCreatedRawResponse {
    scope_table: TBotRelatedTargetTable;
    bot_scope: ProjectColumnBotScope.Interface | ProjectCardBotScope.Interface;
}

export interface IUseBoardBotScopeCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotScopeCreatedHandlers = ({ callback, projectUID }: IUseBoardBotScopeCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotScopeCreatedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-scope-created-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.SCOPE.CREATED,
            callback,
            responseConverter: (data) => {
                if (data.scope_table === "project") {
                    ProjectBotScope.Model.fromOne(data.bot_scope, true);
                } else if (data.scope_table === "project_column") {
                    ProjectColumnBotScope.Model.fromOne(data.bot_scope, true);
                } else if (data.scope_table === "card") {
                    ProjectCardBotScope.Model.fromOne(data.bot_scope, true);
                }
                return {};
            },
        },
    });
};

export default useBoardBotScopeCreatedHandlers;
