import { QUERY_NAMES } from "@/constants";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";

export interface ISignUpForm extends Omit<User.Interface, "uid" | "username" | "avatar" | "groups"> {
    password: string;
    industry: string;
    purpose: string;
    affiliation?: string;
    position?: string;
    avatar?: FileList;
}

const useSignUp = (options?: TMutationOptions<ISignUpForm>) => {
    const { mutate } = useQueryMutation();

    const signUp = async (params: ISignUpForm) => {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            const isAvatar = (targetKey: string, _: unknown): _ is FileList => targetKey === "avatar";

            if (isAvatar(key, value)) {
                if (!value.length) {
                    return;
                }

                formData.append(key, value[0], value[0].name);
            } else {
                formData.append(key, value.toString());
            }
        });

        formData.append("activate_token_query_name", QUERY_NAMES.SIGN_UP_ACTIVATE_TOKEN);

        const res = await api.post(Routing.API.AUTH.SIGN_UP.SEND_LINK, formData, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["sign-up"], signUp, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useSignUp;
