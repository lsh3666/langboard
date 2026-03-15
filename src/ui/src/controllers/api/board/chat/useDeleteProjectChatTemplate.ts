import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteProjectChatTemplateForm {
    project_uid: string;
    template_uid: string;
}

const useDeleteProjectChatTemplate = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deleteProjectChatTemplate = async (params: IDeleteProjectChatTemplateForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CHAT.TEMPLATE.DELETE, {
            uid: params.project_uid,
            template_uid: params.template_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["delete-project-chat-template"], deleteProjectChatTemplate, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteProjectChatTemplate;
