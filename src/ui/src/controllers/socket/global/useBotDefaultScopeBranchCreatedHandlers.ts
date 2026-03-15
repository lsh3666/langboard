import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotDefaultScopeBranchModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBotDefaultScopeBranchCreatedRawResponse {
    default_scope_branch: BotDefaultScopeBranchModel.Interface;
}

const useBotDefaultScopeBranchCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IBotDefaultScopeBranchCreatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "bot-default-scope-branch-created",
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.BOTS.DEFAULT_SCOPE_BRANCH.CREATED,
            callback,
            responseConverter: (data) => {
                BotDefaultScopeBranchModel.Model.fromOne(data.default_scope_branch, true);
                return {};
            },
        },
    });
};

export default useBotDefaultScopeBranchCreatedHandlers;
