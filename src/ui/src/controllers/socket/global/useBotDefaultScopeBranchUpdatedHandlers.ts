import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotDefaultScopeBranchModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBotDefaultScopeBranchUpdatedRawResponse {
    name?: string;
    conditions_map?: Record<string, string>;
}

export interface IUseBotDefaultScopeBranchUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    branch: BotDefaultScopeBranchModel.TModel;
}

const useBotDefaultScopeBranchUpdatedHandlers = ({ callback, branch }: IUseBotDefaultScopeBranchUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBotDefaultScopeBranchUpdatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: `bot-default-scope-branch-updated-${branch.uid}`,
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.BOTS.DEFAULT_SCOPE_BRANCH.UPDATED,
            params: { uid: branch.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    branch[key] = value as never;
                });

                return {};
            },
        },
    });
};

export default useBotDefaultScopeBranchUpdatedHandlers;
