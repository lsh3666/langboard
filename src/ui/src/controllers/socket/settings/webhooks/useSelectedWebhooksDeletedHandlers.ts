import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { WebhookModel } from "@/core/models";
import { ESocketTopic, ESettingSocketTopicID } from "@langboard/core/enums";

export interface ISelectedWebhooksDeletedRawResponse {
    uids: string[];
}

const useSelectedWebhooksDeletedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, ISelectedWebhooksDeletedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: ESettingSocketTopicID.Webhook,
        eventKey: "selected-webhooks-deleted",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.WEBHOOKS.SELECTIONS_DELETED,
            callback,
            responseConverter: (data) => {
                WebhookModel.Model.deleteModels(data.uids);

                return {};
            },
        },
    });
};

export default useSelectedWebhooksDeletedHandlers;
