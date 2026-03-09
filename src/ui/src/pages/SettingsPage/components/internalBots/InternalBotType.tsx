import Box from "@/components/base/Box";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const InternalBotBotType = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const botType = internalBot.useField("bot_type");

    return (
        <Box textSize="lg" weight="semibold">
            <Box as="span" className="max-w-[calc(100%_-_theme(spacing.6))] truncate">
                {t(`internalBot.botTypes.${botType}`)}
            </Box>
        </Box>
    );
});

export default InternalBotBotType;
