import { Button, DateTimePicker, Flex, Floating, IconComponent, Select } from "@/components/base";
import { IBotScheduleFormMap } from "@/components/bots/BotScheduleList/Provider";
import Cron from "@/components/Cron";
import { BaseBotScheduleModel } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotScheduleTriggersMap {
    startAt?: HTMLButtonElement | null;
    endAt?: HTMLButtonElement | null;
}

export interface IBotScheduleListItemFormProps {
    initialValuesMap?: IBotScheduleFormMap;
    valuesMapRef: React.RefObject<IBotScheduleFormMap>;
    triggersMapRef: React.RefObject<IBotScheduleTriggersMap>;
    disabled?: bool;
}

function BotScheduleListItemForm({ initialValuesMap, valuesMapRef, triggersMapRef, disabled }: IBotScheduleListItemFormProps): React.JSX.Element {
    const [t] = useTranslation();
    const [runningType, setRunningType] = useState(initialValuesMap?.runningType ?? BaseBotScheduleModel.ERunningType.Infinite);
    const [startAt, setStartAt] = useState(initialValuesMap?.startAt);
    const [endAt, setEndAt] = useState(initialValuesMap?.endAt);
    const onClickSetDateTime = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            const pickerType = e.currentTarget.getAttribute("data-picker-type");
            if (pickerType !== "end") {
                return;
            }

            if (!startAt) {
                e.preventDefault();
                e.stopPropagation();
                triggersMapRef.current.startAt?.click();
            }
        },
        [startAt, endAt]
    );
    const lastValueCronStringRef = useRef<string>(undefined);

    const onChangeRunningType = (value: BaseBotScheduleModel.ERunningType) => {
        if (valuesMapRef.current.runningType === BaseBotScheduleModel.ERunningType.Onetime && lastValueCronStringRef.current) {
            valuesMapRef.current.interval = lastValueCronStringRef.current;
        }

        setRunningType(value);
        valuesMapRef.current.runningType = value;
        const now = new Date();

        if (BaseBotScheduleModel.RUNNING_TYPES_WITH_START_AT.includes(value)) {
            valuesMapRef.current.startAt = new Date(now.setMinutes(now.getMinutes()));
        } else {
            valuesMapRef.current.startAt = undefined;
        }

        if (BaseBotScheduleModel.RUNNING_TYPES_WITH_END_AT.includes(value)) {
            valuesMapRef.current.endAt = new Date(now.setMinutes(now.getMinutes() + 1));
        } else {
            valuesMapRef.current.endAt = undefined;
        }

        valuesMapRef.current.startAt?.setSeconds(0);
        valuesMapRef.current.endAt?.setSeconds(0);

        setStartAt(valuesMapRef.current.startAt);
        setEndAt(valuesMapRef.current.endAt);

        if (value === BaseBotScheduleModel.ERunningType.Onetime) {
            lastValueCronStringRef.current = valuesMapRef.current.interval;
            valuesMapRef.current.interval = "* * * * *";
        }
    };

    const onChangeCron = (value: string) => {
        valuesMapRef.current.interval = value;
    };

    const handleChangeStartAtDate = (date: Date | undefined) => {
        date?.setSeconds(0);
        setStartAt(date);
        if (valuesMapRef.current.endAt && valuesMapRef.current.endAt.getTime() < (date?.getTime() ?? 0)) {
            setEndAt(date ? new Date(date.getTime() + 60 * 1000) : undefined);
        }
        setTimeout(() => {
            if (BaseBotScheduleModel.RUNNING_TYPES_WITH_END_AT.includes(runningType)) {
                triggersMapRef.current.endAt?.click();
            }
        }, 0);
        valuesMapRef.current.startAt = date;
        if (valuesMapRef.current.endAt && valuesMapRef.current.endAt.getTime() < (date?.getTime() ?? 0)) {
            valuesMapRef.current.endAt = date ? new Date(date.getTime() + 60 * 1000) : undefined;
        }
    };

    const handleChangeEndAtDate = (date: Date | undefined) => {
        date?.setSeconds(0);
        setEndAt(date);
        valuesMapRef.current.endAt = date;
    };

    return (
        <Flex direction="col" gap="2">
            <Floating.LabelSelect
                label={t("bot.Select running type")}
                value={runningType}
                onValueChange={onChangeRunningType}
                disabled={disabled}
                className="w-full"
                options={Object.keys(BaseBotScheduleModel.ERunningType).map((type) => {
                    const runningType = BaseBotScheduleModel.ERunningType[type];
                    return (
                        <Select.Item key={runningType} value={runningType}>
                            {t(`bot.schedules.cronRunningTypes.${runningType}`)}
                        </Select.Item>
                    );
                })}
            />
            {BaseBotScheduleModel.RUNNING_TYPES_WITH_START_AT.includes(runningType) && (
                <DateTimePicker
                    value={startAt}
                    min={new Date(new Date().setMinutes(new Date().getMinutes()))}
                    onChange={handleChangeStartAtDate}
                    timePicker={{
                        hour: true,
                        minute: true,
                        second: false,
                    }}
                    renderTrigger={() => (
                        <Button
                            type="button"
                            variant={startAt ? "default" : "outline"}
                            className={cn("h-8 gap-2 px-3 lg:h-10", startAt && "rounded-r-none")}
                            title={t("bot.schedules.Set start time")}
                            data-picker-type="start"
                            onClick={onClickSetDateTime}
                            ref={(elem) => {
                                triggersMapRef.current.startAt = elem;
                            }}
                        >
                            <IconComponent icon="calendar" size="4" />
                            {startAt ? Utils.String.formatDateLocale(startAt) : t("bot.schedules.Set start time")}
                        </Button>
                    )}
                />
            )}
            {BaseBotScheduleModel.RUNNING_TYPES_WITH_END_AT.includes(runningType) && (
                <DateTimePicker
                    value={endAt}
                    min={startAt ? new Date(startAt!.getTime() + 60 * 1000) : undefined}
                    onChange={handleChangeEndAtDate}
                    timePicker={{
                        hour: true,
                        minute: true,
                        second: false,
                    }}
                    renderTrigger={() => (
                        <Button
                            type="button"
                            variant={endAt ? "default" : "outline"}
                            className={cn("h-8 gap-2 px-3 lg:h-10", endAt && "rounded-r-none")}
                            title={t("bot.schedules.Set end time")}
                            data-picker-type="end"
                            onClick={onClickSetDateTime}
                            ref={(elem) => {
                                triggersMapRef.current.endAt = elem;
                            }}
                        >
                            <IconComponent icon="calendar" size="4" />
                            {endAt ? Utils.String.formatDateLocale(endAt) : t("bot.schedules.Set end time")}
                        </Button>
                    )}
                />
            )}
            {runningType !== BaseBotScheduleModel.ERunningType.Onetime && (
                <Cron value={initialValuesMap?.interval ?? "@reboot"} setValue={onChangeCron} disabled={disabled} readOnly={disabled} />
            )}
        </Flex>
    );
}

export default BotScheduleListItemForm;
