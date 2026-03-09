import Box from "@/components/base/Box";
import Floating from "@/components/base/Floating";
import Toast from "@/components/base/Toast";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { SettingRole } from "@/core/models/roles";
import { ROUTES } from "@/core/routing/constants";
import { Utils } from "@langboard/core/utils";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const InternalBotApiURL = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const navigate = usePageNavigateRef();
    const { currentUser } = useAppSetting();
    const settingRoleActions = currentUser.useField("setting_role_actions");
    const { hasRoleAction } = useRoleActionFilter(settingRoleActions);
    const canUpdateInternalBot = hasRoleAction(SettingRole.EAction.InternalBotUpdate);
    const apiURL = internalBot.useField("url");
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });
    const inputRef = useRef<HTMLInputElement>(null);
    const [isValidating, setIsValidating] = useState(false);

    const change = () => {
        if (isValidating || !inputRef.current || !canUpdateInternalBot) {
            return;
        }

        const value = inputRef.current.value.trim();
        if (value === apiURL || !value || !Utils.String.isValidURL(value)) {
            inputRef.current.value = apiURL;
            return;
        }

        const promise = mutateAsync({
            api_url: value,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Internal bot API URL changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            change();
            return;
        }
    };

    return (
        <Box>
            <Floating.LabelInput
                label={t("settings.Internal bot API URL")}
                autoComplete="off"
                defaultValue={apiURL}
                onBlur={change}
                onKeyDown={handleKeyDown}
                disabled={!canUpdateInternalBot}
                ref={inputRef}
            />
        </Box>
    );
});

export default InternalBotApiURL;
