import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";

export interface IUpdateProfileForm extends Pick<User.Interface, "firstname" | "lastname"> {
    affiliation?: string;
    position?: string;
    avatar?: FileList;
}

const useUpdateProfile = (options?: TMutationOptions<IUpdateProfileForm>) => {
    const { mutate } = useQueryMutation();

    const updateProfile = async (params: IUpdateProfileForm) => {
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
                formData.append(key, value);
            }
        });

        const res = await api.put(Routing.API.ACCOUNT.UPDATE_PROFILE, formData, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["update-profile"], updateProfile, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateProfile;
