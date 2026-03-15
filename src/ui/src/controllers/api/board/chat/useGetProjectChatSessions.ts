import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ChatSessionModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useGetProjectChatSessions = (projectUID: string, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getProjectChatSessions = async () => {
        const url = Utils.String.format(Routing.API.BOARD.CHAT.GET_SESSIONS, { uid: projectUID });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        ChatSessionModel.Model.fromArray(res.data.sessions, true);

        return { isUpdated: true };
    };

    const result = mutate([`get-project-chat-sessions-${projectUID}`], getProjectChatSessions, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetProjectChatSessions;
