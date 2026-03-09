import { useCallback } from "react";
import { PeriodProps, PeriodType } from "@/components/Cron/types";
import Flex from "@/components/base/Flex";
import Select from "@/components/base/Select";
import { useTranslation } from "react-i18next";

interface IBaseOptionType {
    value: string;
    label: string;
}

function Period(props: PeriodProps) {
    const [t] = useTranslation();
    const { value, setValue, disabled, readOnly, shortcuts, allowedPeriods } = props;
    const options: IBaseOptionType[] = [];

    if (allowedPeriods.includes("year")) {
        options.push({
            value: "year",
            label: t("cron.year"),
        });
    }

    if (allowedPeriods.includes("month")) {
        options.push({
            value: "month",
            label: t("cron.month"),
        });
    }

    if (allowedPeriods.includes("week")) {
        options.push({
            value: "week",
            label: t("cron.week"),
        });
    }

    if (allowedPeriods.includes("day")) {
        options.push({
            value: "day",
            label: t("cron.day"),
        });
    }

    if (allowedPeriods.includes("hour")) {
        options.push({
            value: "hour",
            label: t("cron.hour"),
        });
    }

    if (allowedPeriods.includes("minute")) {
        options.push({
            value: "minute",
            label: t("cron.minute"),
        });
    }

    if (allowedPeriods.includes("reboot") && shortcuts && (shortcuts === true || shortcuts.includes("@reboot"))) {
        options.push({
            value: "reboot",
            label: t("cron.reboot"),
        });
    }

    const handleChange = useCallback(
        (newValue: PeriodType) => {
            if (!readOnly) {
                setValue(newValue);
            }
        },
        [setValue, readOnly]
    );

    return (
        <Flex items="center" gap="2">
            <span>{t("cron.Every")}</span>

            {disabled ? (
                options
                    .filter((option) => option.value === value)
                    .map((option) => option.label)
                    .join("")
            ) : (
                <Select.Root value={value} onValueChange={handleChange}>
                    <Select.Trigger>
                        <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                        {options.map((option) => (
                            <Select.Item key={option.value} value={option.value} disabled={disabled}>
                                {option.label}
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            )}
        </Flex>
    );
}

export default Period;
