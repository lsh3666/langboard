import { Floating, Select } from "@/components/base";
import { EBotPlatform } from "@langboard/core/ai";
import { useTranslation } from "react-i18next";

export interface IBotPlatformSelectProps {
    state: [EBotPlatform, (value: EBotPlatform) => void | Promise<void>];
    isValidating?: bool;
}

function BotPlatformSelect({ state, isValidating }: IBotPlatformSelectProps) {
    const [t] = useTranslation();
    const [selectedPlatform, setSelectedPlatform] = state;

    return (
        <Floating.LabelSelect
            label={t("settings.Select a platform")}
            value={selectedPlatform}
            onValueChange={setSelectedPlatform as (value: string) => void}
            disabled={isValidating}
            required
            options={Object.keys(EBotPlatform).map((platformKey) => {
                const platform = EBotPlatform[platformKey];
                return (
                    <Select.Item value={platform} key={`bot-platform-select-${platform}`}>
                        {t(`bot.platforms.${platform}`)}
                    </Select.Item>
                );
            })}
        />
    );
}

export default BotPlatformSelect;
