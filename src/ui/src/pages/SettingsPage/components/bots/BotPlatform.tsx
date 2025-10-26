import { Box, Toast } from "@/components/base";
import BotPlatformSelect from "@/components/bots/BotPlatformSelect";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EBotPlatform } from "@langboard/core/ai";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BotPlatform = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.BotModel.useContext();
    const navigate = usePageNavigateRef();
    const platform = internalBot.useField("platform");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateBot(internalBot, { interceptToast: true });

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
                return t("successes.Bot platform changed successfully.");
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

export default BotPlatform;
