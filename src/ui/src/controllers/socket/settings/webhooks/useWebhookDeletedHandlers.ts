import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { WebhookModel } from "@/core/models";
import { ESocketTopic, ESettingSocketTopicID } from "@langboard/core/enums";

export interface IUseWebhookDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    webhook: WebhookModel.TModel;
}

const useWebhookDeletedHandlers = ({ callback, webhook }: IUseWebhookDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.AppSettings,
        topicId: ESettingSocketTopicID.Webhook,
        eventKey: `webhook-deleted-${webhook.uid}`,
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.WEBHOOKS.DELETED,
            params: { uid: webhook.uid },
            callback,
            responseConverter: () => {
                WebhookModel.Model.deleteModel(webhook.uid);

                return {};
            },
        },
    });
};

export default useWebhookDeletedHandlers;
