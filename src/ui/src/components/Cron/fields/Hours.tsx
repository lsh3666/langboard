import CustomSelect from "@/components/Cron/CustomSelect";
import { UNITS } from "@/components/Cron/constants";
import { HoursProps } from "@/components/Cron/types";
import Flex from "@/components/base/Flex";
import { useTranslation } from "react-i18next";

export default function Hours(props: HoursProps) {
    const [t] = useTranslation();
    const { value, setValue, className, disabled, readOnly, leadingZero, clockFormat, period, periodicityOnDoubleClick, mode, filterOption } = props;

    return (
        <Flex items="center" gap="2">
            <span>{t("cron.at")}</span>

            <CustomSelect
                placeholder={t("cron.every hour")}
                value={value}
                unit={UNITS[1]}
                setValue={setValue}
                className={className}
                disabled={disabled}
                readOnly={readOnly}
                leadingZero={leadingZero}
                clockFormat={clockFormat}
                period={period}
                periodicityOnDoubleClick={periodicityOnDoubleClick}
                mode={mode}
                filterOption={filterOption}
            />
        </Flex>
    );
}
