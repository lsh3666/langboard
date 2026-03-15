import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ChatTemplateModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IGetProjectChatTemplatesForm {
    project_uid: string;
}

const useGetProjectChatTemplates = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getProjectChatTemplates = async (params: IGetProjectChatTemplatesForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CHAT.TEMPLATE.GET_LIST, {
            uid: params.project_uid,
        });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        ChatTemplateModel.Model.fromArray(res.data.templates, true);

        return {};
    };

    const result = mutate(["get-project-chat-templates"], getProjectChatTemplates, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetProjectChatTemplates;
