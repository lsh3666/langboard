import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { InternalBotModel } from "@/core/models";
import { ESocketTopic, ESettingSocketTopicID } from "@langboard/core/enums";

export interface IInternalBotSettingDefaultChangedRawResponse {
    uid: string;
    bot_type: InternalBotModel.EInternalBotType;
}

export interface IInternalBotSettingDefaultChangedProps extends IBaseUseSocketHandlersProps<{}> {
    internalBot: InternalBotModel.TModel;
}

const useInternalBotSettingDefaultChangedHandlers = ({ internalBot, callback }: IInternalBotSettingDefaultChangedProps) => {
    return useSocketHandler<{}, IInternalBotSettingDefaultChangedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: ESettingSocketTopicID.InternalBot,
        eventKey: `internal-bot-setting-default-changed-${internalBot.uid}`,
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.INTERNAL_BOTS.DEFAULT_CHANGED,
            params: { uid: internalBot.uid },
            callback,
            responseConverter: (data) => {
                InternalBotModel.Model.getModels((model) => {
                    if (model.bot_type === data.bot_type) {
                        model.is_default = false;
                    }
                    return false;
                });
                internalBot.is_default = true;
                return {};
            },
        },
    });
};

export default useInternalBotSettingDefaultChangedHandlers;
