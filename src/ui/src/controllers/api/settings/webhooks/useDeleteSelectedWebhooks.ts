import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { WebhookModel } from "@/core/models";

export interface IDeleteSelectedWebhooksForm {
    webhook_uids: string[];
}

const useDeleteSelectedWebhooks = (options?: TMutationOptions<IDeleteSelectedWebhooksForm>) => {
    const { mutate } = useQueryMutation();

    const deleteSelectedWebhooks = async (params: IDeleteSelectedWebhooksForm) => {
        const res = await api.delete(Routing.API.SETTINGS.WEBHOOKS.DELETE_SELECTED, {
            data: params,
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        WebhookModel.Model.deleteModels(params.webhook_uids);

        return res.data;
    };

    const result = mutate(["delete-selected-webhooks"], deleteSelectedWebhooks, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSelectedWebhooks;
