import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IAcceptProjectInvitationForm {
    token: string;
}

export interface IAcceptProjectInvitationResponse {
    project_uid: string;
}

const useAcceptProjectInvitation = (options?: TMutationOptions<IAcceptProjectInvitationForm, IAcceptProjectInvitationResponse>) => {
    const { mutate } = useQueryMutation();

    const acceptProjectInvitation = async (params: IAcceptProjectInvitationForm) => {
        const res = await api.post(
            Routing.API.BOARD.ACCEPT_INVITATION,
            {
                invitation_token: params.token,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["accept-project-invitation"], acceptProjectInvitation, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useAcceptProjectInvitation;
