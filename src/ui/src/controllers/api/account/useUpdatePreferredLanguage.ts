import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IUpdatePreferredLanguageForm {
    lang: string;
}

const useUpdatePreferredLanguage = (options?: TMutationOptions<IUpdatePreferredLanguageForm>) => {
    const { mutate } = useQueryMutation();

    const updatePreferredLanguage = async (params: IUpdatePreferredLanguageForm) => {
        const res = await api.put(
            Routing.API.ACCOUNT.UPDATE_PREFERRED_LANGUAGE,
            {
                lang: params.lang,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["update-preferred-language"], updatePreferredLanguage, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdatePreferredLanguage;
