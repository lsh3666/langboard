import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotDefaultScopeBranchModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBotDefaultScopeBranchDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    branch: BotDefaultScopeBranchModel.TModel;
}

const useBotDefaultScopeBranchDeletedHandlers = ({ callback, branch }: IUseBotDefaultScopeBranchDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.Global,
        eventKey: `bot-default-scope-branch-deleted-${branch.uid}`,
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.BOTS.DEFAULT_SCOPE_BRANCH.DELETED,
            params: { uid: branch.uid },
            callback,
            responseConverter: () => {
                BotDefaultScopeBranchModel.Model.deleteModel(branch.uid);
                return {};
            },
        },
    });
};

export default useBotDefaultScopeBranchDeletedHandlers;
