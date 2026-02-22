import { Checkbox, Flex, Toast, Tooltip } from "@/components/base";
import useActivateApiKey from "@/controllers/api/settings/apiKeys/useActivateApiKey";
import useDeactivateApiKey from "@/controllers/api/settings/apiKeys/useDeactivateApiKey";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { ApiKeySettingModel } from "@/core/models";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IApiKeyActivationProps {
    apiKey: ApiKeySettingModel.TModel;
}

const ApiKeyActivation = memo(({ apiKey }: IApiKeyActivationProps) => {
    const [t] = useTranslation();
    const rawActivatedAt = apiKey.useField("activated_at");
    const activatedAt = useUpdateDateDistance(rawActivatedAt);
    const { mutateAsync: activateMutateAsync } = useActivateApiKey(apiKey);
    const { mutateAsync: deactivateMutateAsync } = useDeactivateApiKey(apiKey);
    const [isValidating, setIsValidating] = useState(false);

    const toggle = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const activate = !rawActivatedAt;
        const promise = activate ? activateMutateAsync : deactivateMutateAsync;

        Toast.Add.promise(promise({}), {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            // TODO: Handle 403 error if needed
                        },
                    },
                    messageRef
                );
                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t(`successes.API key ${activate ? "activated" : "deactivated"} successfully.`);
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <Flex justify="center" w="full">
                    <Checkbox checked={!!rawActivatedAt} onClick={toggle} />
                </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom" align="center">
                {rawActivatedAt ? activatedAt : t("settings.Activate")}
            </Tooltip.Content>
        </Tooltip.Root>
    );
});

export default ApiKeyActivation;
