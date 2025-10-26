import { Box, Toast } from "@/components/base";
import BotPlatformRunningTypeSelect from "@/components/bots/BotPlatformRunningTypeSelect";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EBotPlatformRunningType } from "@langboard/core/ai";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const InternalBotPlatformRunningType = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const navigate = usePageNavigateRef();
    const platform = internalBot.useField("platform");
    const platformRunningType = internalBot.useField("platform_running_type");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });

    const changePlatformRunningType = async (value: EBotPlatformRunningType) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            platform_running_type: value,
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
                return t("successes.Internal bot platform running type changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <BotPlatformRunningTypeSelect state={[platformRunningType, changePlatformRunningType]} platform={platform} isValidating={isValidating} />
        </Box>
    );
});

export default InternalBotPlatformRunningType;
