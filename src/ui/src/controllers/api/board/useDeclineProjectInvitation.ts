import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IDeclineProjectInvitationForm {
    token: string;
}

export interface IDeclineProjectInvitationResponse {}

const useDeclineProjectInvitation = (options?: TMutationOptions<IDeclineProjectInvitationForm, IDeclineProjectInvitationResponse>) => {
    const { mutate } = useQueryMutation();

    const declineProjectInvitation = async (params: IDeclineProjectInvitationForm) => {
        const res = await api.post(
            Routing.API.BOARD.DECLINE_INVITATION,
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

    const result = mutate(["decline-project-invitation"], declineProjectInvitation, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeclineProjectInvitation;
