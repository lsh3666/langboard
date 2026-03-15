import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { WebhookModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useDeleteWebhook = (webhook: WebhookModel.TModel, options?: TMutationOptions<unknown>) => {
    const { mutate } = useQueryMutation();

    const deleteWebhook = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.WEBHOOKS.DELETE, { webhook_uid: webhook.uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        WebhookModel.Model.deleteModel(webhook.uid);

        return res.data;
    };

    const result = mutate(["delete-webhook"], deleteWebhook, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteWebhook;
