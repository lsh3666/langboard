import CustomSelect from "@/components/Cron/CustomSelect";
import { UNITS } from "@/components/Cron/constants";
import { MinutesProps } from "@/components/Cron/types";
import Flex from "@/components/base/Flex";
import { useTranslation } from "react-i18next";

export default function Minutes(props: MinutesProps) {
    const [t] = useTranslation();
    const { value, setValue, className, disabled, readOnly, leadingZero, clockFormat, period, periodicityOnDoubleClick, mode, filterOption } = props;

    return (
        <Flex items="center" gap="2">
            {period === "hour" ? <span>{t("cron.at")}</span> : <span>{t("cron.prefixMinutes")}</span>}

            <CustomSelect
                placeholder={period === "hour" ? t("cron.every") : t("cron.every minute")}
                value={value}
                unit={UNITS[0]}
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

            {period === "hour" && <span>{t("cron.minute(s)")}</span>}
        </Flex>
    );
}
