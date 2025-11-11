import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";
import { EBotPlatform, EBotPlatformRunningType } from "@langboard/core/ai";

export interface IBotSettingUpdatedRawResponse {
    api_url?: string;
    platform?: EBotPlatform;
    platform_running_type?: EBotPlatformRunningType;
    api_key?: string;
    app_api_token?: string;
    ip_whitelist?: string[];
    value?: string;
}

export interface IUseBotSettingUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    bot: BotModel.TModel;
}

const useBotSettingUpdatedHandlers = ({ callback, bot }: IUseBotSettingUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBotSettingUpdatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: `bot-setting-updated-${bot.uid}`,
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.BOTS.UPDATED,
            params: { uid: bot.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    if (key === "platform") {
                        if (Utils.Type.isString(value)) {
                            value = EBotPlatform[new Utils.String.Case(value).toPascal() as keyof typeof EBotPlatform];
                        }
                    }

                    if (key === "platform_running_type") {
                        if (Utils.Type.isString(value)) {
                            value = EBotPlatformRunningType[new Utils.String.Case(value).toPascal() as keyof typeof EBotPlatformRunningType];
                        }
                    }

                    bot[key] = value as never;
                });

                return {};
            },
        },
    });
};

export default useBotSettingUpdatedHandlers;
