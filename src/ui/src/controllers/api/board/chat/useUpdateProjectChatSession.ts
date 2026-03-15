import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IUpdateProjectChatSessionForm {
    uid: string;
    session_uid: string;
    title: string;
}

const useUpdateProjectChatSession = (options?: TMutationOptions<IUpdateProjectChatSessionForm>) => {
    const { mutate } = useQueryMutation();

    const updateProjectChatSession = async (params: IUpdateProjectChatSessionForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CHAT.UPDATE_SESSION, { uid: params.uid, session_uid: params.session_uid });
        const res = await api.put(
            url,
            { title: params.title },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["update-project-chat-session"], updateProjectChatSession, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateProjectChatSession;
