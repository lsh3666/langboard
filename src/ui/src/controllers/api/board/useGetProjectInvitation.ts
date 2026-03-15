import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IGetProjectInvitationForm {
    token: string;
}

export interface IGetProjectInvitationResponse {
    project: {
        title: string;
    };
}

const useGetProjectInvitation = (options?: TMutationOptions<IGetProjectInvitationForm, IGetProjectInvitationResponse>) => {
    const { mutate } = useQueryMutation();

    const getProjectInvitation = async (form: IGetProjectInvitationForm) => {
        const url = Utils.String.format(Routing.API.BOARD.GET_INVITATION, { token: form.token });
        const res = await api.post(url, undefined, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["get-project-invitation"], getProjectInvitation, {
        ...options,
        retry: 0,
    });
    return result;
};

export default useGetProjectInvitation;
