import { Box, Toast } from "@/components/base";
import BotPlatformSelect from "@/components/bots/BotPlatformSelect";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EBotPlatform } from "@langboard/core/ai";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const InternalBotPlatform = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const navigate = usePageNavigateRef();
    const platform = internalBot.useField("platform");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });

    const changePlatform = async (value: EBotPlatform) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            platform: value,
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
                return t("successes.Internal bot platform changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <BotPlatformSelect state={[platform, changePlatform]} isValidating={isValidating} />
        </Box>
    );
});

export default InternalBotPlatform;
