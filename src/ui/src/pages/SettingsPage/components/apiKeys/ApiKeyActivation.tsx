import Checkbox from "@/components/base/Checkbox";
import Flex from "@/components/base/Flex";
import Toast from "@/components/base/Toast";
import Tooltip from "@/components/base/Tooltip";
import useActivateApiKey from "@/controllers/api/settings/apiKeys/useActivateApiKey";
import useDeactivateApiKey from "@/controllers/api/settings/apiKeys/useDeactivateApiKey";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ApiKeySettingModel } from "@/core/models";
import { ApiKeyRole } from "@/core/models/roles";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IApiKeyActivationProps {
    apiKey: ApiKeySettingModel.TModel;
}

const ApiKeyActivation = memo(({ apiKey }: IApiKeyActivationProps) => {
    const [t] = useTranslation();
    const { currentUser } = useAppSetting();
    const apiKeyRoleActions = currentUser.useField("api_key_role_actions");
    const { hasRoleAction } = useRoleActionFilter(apiKeyRoleActions);
    const canUpdateApiKey = hasRoleAction(ApiKeyRole.EAction.Update);
    const rawActivatedAt = apiKey.useField("activated_at");
    const activatedAt = useUpdateDateDistance(rawActivatedAt);
    const { mutateAsync: activateMutateAsync } = useActivateApiKey(apiKey);
    const { mutateAsync: deactivateMutateAsync } = useDeactivateApiKey(apiKey);
    const [isValidating, setIsValidating] = useState(false);

    const toggle = () => {
        if (isValidating || !canUpdateApiKey) {
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
                    <Checkbox checked={!!rawActivatedAt} onClick={toggle} disabled={!canUpdateApiKey} />
                </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom" align="center">
                {rawActivatedAt ? activatedAt : t("settings.Activate")}
            </Tooltip.Content>
        </Tooltip.Root>
    );
});

export default ApiKeyActivation;
