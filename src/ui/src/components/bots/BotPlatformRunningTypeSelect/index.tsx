import { Floating, Select } from "@/components/base";
import { AVAILABLE_RUNNING_TYPES_BY_PLATFORM, EBotPlatform, EBotPlatformRunningType } from "@langboard/core/ai";
import { useTranslation } from "react-i18next";

export interface IBotPlatformRunningTypeSelectProps {
    state: [EBotPlatformRunningType, (value: EBotPlatformRunningType) => void | Promise<void>];
    platform: EBotPlatform;
    isValidating?: bool;
}

function BotPlatformRunningTypeSelect({ state, platform, isValidating }: IBotPlatformRunningTypeSelectProps) {
    const [t] = useTranslation();
    const [platformRunningType, changePlatformRunningType] = state;

    return (
        <Floating.LabelSelect
            label={t("settings.Select a platform running type")}
            value={platformRunningType}
            defaultValue={platformRunningType.toString()}
            onValueChange={changePlatformRunningType as (value: string) => void}
            disabled={isValidating}
            required
            options={AVAILABLE_RUNNING_TYPES_BY_PLATFORM[platform].map((targetPlatformRunningType) => (
                <Select.Item value={targetPlatformRunningType.toString()} key={`bot-platform-running-type-select-${targetPlatformRunningType}`}>
                    {t(`bot.platformRunningTypes.${targetPlatformRunningType}`)}
                </Select.Item>
            ))}
        />
    );
}

export default BotPlatformRunningTypeSelect;
