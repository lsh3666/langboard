import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface ICreateUserInSettingsForm {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    industry: string;
    purpose: string;
    affiliation?: string;
    position?: string;
    is_admin?: bool;
    should_activate?: bool;
}

const useCreateUserInSettings = (options?: TMutationOptions<ICreateUserInSettingsForm>) => {
    const { mutate } = useQueryMutation();

    const createUserInSettings = async (params: ICreateUserInSettingsForm) => {
        const res = await api.post(Routing.API.SETTINGS.USERS.CREATE, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["create-user-in-settings"], createUserInSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateUserInSettings;
