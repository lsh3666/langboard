import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { ESocketTopic, ESettingSocketTopicID } from "@langboard/core/enums";

export interface IBotSettingCreatedRawResponse {
    setting_bot: BotModel.Interface;
}

const useBotSettingCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IBotSettingCreatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: ESettingSocketTopicID.Bot,
        eventKey: "bot-setting-created",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.BOTS.CREATED,
            callback,
            responseConverter: (data) => {
                BotModel.Model.fromOne(data.setting_bot, true);
                return {};
            },
        },
    });
};

export default useBotSettingCreatedHandlers;
