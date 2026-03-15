import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteProjectChatSessionForm {
    uid: string;
    session_uid: string;
}

const useDeleteProjectChatSession = (options?: TMutationOptions<IDeleteProjectChatSessionForm>) => {
    const { mutate } = useQueryMutation();

    const deleteProjectChatSession = async (params: IDeleteProjectChatSessionForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CHAT.DELETE_SESSION, { uid: params.uid, session_uid: params.session_uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["delete-project-chat-session"], deleteProjectChatSession, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteProjectChatSession;
