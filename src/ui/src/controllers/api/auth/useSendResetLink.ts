import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

interface IBaseResetLinkForm {
    sign_token: string;
    email_token: string;
    is_resend?: bool;
    firstname?: string;
    lastname?: string;
}

interface IResendResetLinkForm extends IBaseResetLinkForm {
    is_resend: true;
}

interface ISendResetLinkForm extends IBaseResetLinkForm {
    firstname: string;
    lastname: string;
}

export type TSendResetLinkForm = ISendResetLinkForm | IResendResetLinkForm;

const useSendResetLink = (options?: TMutationOptions<TSendResetLinkForm>) => {
    const { mutate } = useQueryMutation();

    const sendResetLink = async (params: TSendResetLinkForm) => {
        const res = await api.post(
            Routing.API.AUTH.RECOVERY.SEND_LINK,
            {
                ...params,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["send-recovery-code"], sendResetLink, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useSendResetLink;
