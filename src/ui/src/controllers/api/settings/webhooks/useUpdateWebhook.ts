/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { WebhookModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IUpdateWebhookForm {
    name?: string;
    url?: string;
}

const useUpdateWebhook = (webhook: WebhookModel.TModel, options?: TMutationOptions<IUpdateWebhookForm>) => {
    const { mutate } = useQueryMutation();

    const updateWebhook = async (params: IUpdateWebhookForm) => {
        const url = Utils.String.format(Routing.API.SETTINGS.WEBHOOKS.UPDATE, { webhook_uid: webhook.uid });
        const res = await api.put(
            url,
            {
                name: params.name,
                url: params.url,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        WebhookModel.Model.fromOne({
            uid: webhook.uid,
            ...res.data,
        });

        return res.data;
    };

    const result = mutate(["update-webhook"], updateWebhook, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateWebhook;
