import { Alert, Box, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { memo, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EHttpStatus } from "@langboard/core/enums";
import { getValueType } from "@/components/bots/BotValueInput/utils";
import { EBotPlatformRunningType } from "@langboard/core/ai";
import BotValueInput from "@/components/bots/BotValueInput";
import { TBotValueDefaultInputRefLike } from "@/components/bots/BotValueInput/types";

const BotValue = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.BotModel.useContext();
    const navigate = usePageNavigateRef();
    const platform = internalBot.useField("platform");
    const platformRunningType = internalBot.useField("platform_running_type");
    const value = internalBot.useField("value");
    const valueType = useMemo(() => getValueType(platform, platformRunningType), [platform, platformRunningType]);
    const { mutateAsync } = useUpdateBot(internalBot, { interceptToast: true });
    const newValueRef = useRef<string>(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | TBotValueDefaultInputRefLike | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const change = () => {
        const input = inputRef.current;
        if (isValidating || !newValueRef.current || !input) {
            return;
        }

        if (input.type === "default-bot-json") {
            const validated = (input as TBotValueDefaultInputRefLike).validate(true);
            if (!validated) {
                return;
            }
        }

        const newValue = newValueRef.current.trim();
        if (value.trim() === newValue || !newValue) {
            newValueRef.current = newValue;
            return;
        }

        const promise = mutateAsync({
            value: newValue,
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
                if (input.type === "default-bot-json") {
                    (input as TBotValueDefaultInputRefLike).onSuccess();
                }

                return t("successes.Bot value changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box w="full">
            {platformRunningType === EBotPlatformRunningType.FlowJson && (
                <Alert variant="warning" icon="alert-triangle" title={t("common.Warning")} className="mb-2">
                    {t("settings.The internal flows server should be running to use.")}
                </Alert>
            )}
            <BotValueInput
                platform={platform}
                platformRunningType={platformRunningType}
                value={value}
                label={t(`bot.platformRunningTypes.${platformRunningType}`)}
                valueType={valueType}
                newValueRef={newValueRef}
                isValidating={isValidating}
                change={change}
                required
                ref={inputRef}
            />
        </Box>
    );
});

export default BotValue;
