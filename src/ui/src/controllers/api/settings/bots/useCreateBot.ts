/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";
import { EBotPlatform, EBotPlatformRunningType } from "@langboard/core/ai";

export interface ICreateBotForm {
    bot_name: string;
    bot_uname: string;
    platform: EBotPlatform;
    platform_running_type: EBotPlatformRunningType;
    api_url?: string;
    api_key?: string;
    ip_whitelist: string[];
    value?: string;
    avatar?: File;
}

export interface ICreateBotResponse {
    revealed_app_api_token: string;
}

const useCreateBot = (options?: TMutationOptions<ICreateBotForm, ICreateBotResponse>) => {
    const { mutate } = useQueryMutation();

    const createBot = async (form: ICreateBotForm) => {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            const isAvatar = (targetKey: string, _: unknown): _ is File => targetKey === "avatar";

            if (isAvatar(key, value)) {
                if (!value) {
                    return;
                }

                formData.append(key, value, value.name);
            } else {
                formData.append(key, value.toString());
            }
        });

        const res = await api.post(Routing.API.SETTINGS.BOTS.CREATE, formData, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        BotModel.Model.fromOne(res.data.bot, true);

        return {
            revealed_app_api_token: res.data.revealed_app_api_token,
        };
    };

    const result = mutate(["create-bot"], createBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateBot;
