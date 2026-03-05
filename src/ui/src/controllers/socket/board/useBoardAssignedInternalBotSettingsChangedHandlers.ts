import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";
import { InternalBotModel, Project } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IBoardAssignedInternalBotSettingsChangedResponse {
    bot_type: InternalBotModel.EInternalBotType;
    use_default_prompt: bool;
    prompt: string;
}

// eslint-disable-next-line @/max-len
export interface IUseBoardAssignedInternalBotSettingsChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardAssignedInternalBotSettingsChangedResponse> {
    project: Project.TModel;
}

const useBoardAssignedInternalBotSettingsChangedHandlers = ({ callback, project }: IUseBoardAssignedInternalBotSettingsChangedHandlersProps) => {
    return useSocketHandler<IBoardAssignedInternalBotSettingsChangedResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: project.uid,
        eventKey: `board-assigned-internal-bot-settings-changed-${project.uid}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.SETTINGS.INTERNAL_BOT.SETTINGS_CHANGED,
            params: { uid: project.uid },
            callback,
            responseConverter: (data) => {
                data.bot_type = Utils.String.convertSafeEnum(InternalBotModel.EInternalBotType, data.bot_type);
                const newInternalBotSettings = { ...project.internal_bot_settings };
                newInternalBotSettings[data.bot_type] = {
                    use_default_prompt: data.use_default_prompt,
                    prompt: data.prompt,
                };
                project.internal_bot_settings = newInternalBotSettings;
                return data;
            },
        },
    });
};

export default useBoardAssignedInternalBotSettingsChangedHandlers;
