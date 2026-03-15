import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface ICreateProjectChatTemplateForm {
    project_uid: string;
    name: string;
    template: string;
}

const useCreateProjectChatTemplate = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const createProjectChatTemplate = async (params: ICreateProjectChatTemplateForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CHAT.TEMPLATE.CREATE, {
            uid: params.project_uid,
        });
        const res = await api.post(
            url,
            {
                name: params.name,
                template: params.template,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["create-project-chat-template"], createProjectChatTemplate, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateProjectChatTemplate;
