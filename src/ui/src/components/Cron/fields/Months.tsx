import CustomSelect from "@/components/Cron/CustomSelect";
import { UNITS } from "@/components/Cron/constants";
import { MonthsProps } from "@/components/Cron/types";
import Flex from "@/components/base/Flex";
import { useTranslation } from "react-i18next";

function Months(props: MonthsProps) {
    const [t] = useTranslation();
    const { value, setValue, className, humanizeLabels, disabled, readOnly, period, periodicityOnDoubleClick, mode, filterOption } = props;
    const optionsList = t("cron.months", { returnObjects: true }) as string[];

    return (
        <Flex items="center" gap="2">
            <span>{t("cron.in")}</span>

            <CustomSelect
                placeholder={t("cron.every month")}
                optionsList={optionsList}
                value={value}
                unit={{
                    ...UNITS[3],
                    alt: t("cron.altMonths", { returnObjects: true }) as string[],
                }}
                setValue={setValue}
                className={className}
                humanizeLabels={humanizeLabels}
                disabled={disabled}
                readOnly={readOnly}
                period={period}
                periodicityOnDoubleClick={periodicityOnDoubleClick}
                mode={mode}
                filterOption={filterOption}
            />
        </Flex>
    );
}

export default Months;
