import Button from "@/components/base/Button";
import Flex from "@/components/base/Flex";
import Popover from "@/components/base/Popover";
import SubmitButton from "@/components/base/SubmitButton";
import Toast from "@/components/base/Toast";
import BotScheduleListItemForm, { IBotScheduleTriggersMap } from "@/components/bots/BotScheduleList/ItemForm";
import { IBotScheduleFormMap, useBotScheduleList } from "@/components/bots/BotScheduleList/Provider";
import useRescheduleBotCron from "@/controllers/api/shared/botSchedules/useRescheduleBotCron";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BaseBotScheduleModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotScheduleListItemEditProps {
    schedule: BaseBotScheduleModel.TModel;
    variant?: React.ComponentProps<typeof Button>["variant"];
    className?: string;
}

function BotScheduleListItemEdit({
    schedule,
    variant = "outline",
    className = "border-0 [&:first-child]:rounded-b-none [&:not(:first-child)]:rounded-t-none [&:not(:first-child)]:border-t",
}: IBotScheduleListItemEditProps): React.JSX.Element {
    const { bot, params, target } = useBotScheduleList();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: rescheduleBotCronMutateAsync } = useRescheduleBotCron(
        { ...params, bot_uid: bot.uid, schedule_uid: schedule.uid },
        { interceptToast: true }
    );
    const runningType = schedule.useField("running_type");
    const rawIntervalStr = schedule.useField("interval_str");
    const intervalStr = useMemo(() => Utils.String.Crontab.restoreTimezone(rawIntervalStr), [rawIntervalStr]);
    const startAt = schedule.useField("start_at");
    const endAt = schedule.useField("end_at");
    const valuesMapRef = useRef<IBotScheduleFormMap>({
        runningType: runningType,
        interval: intervalStr,
        startAt: startAt,
        endAt: endAt,
    });
    const triggersMapRef = useRef<IBotScheduleTriggersMap>({});
    const [isOpened, setIsOpened] = useState(false);

    const createSchedule = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        valuesMapRef.current.runningType = valuesMapRef.current.runningType ?? BaseBotScheduleModel.ERunningType.Infinite;

        if (BaseBotScheduleModel.RUNNING_TYPES_WITH_START_AT.includes(valuesMapRef.current.runningType)) {
            if (!valuesMapRef.current.startAt) {
                Toast.Add.error(t("bot.schedules.errors.Cron start time is required."));
                triggersMapRef.current.startAt?.focus();
                return;
            }
        }

        if (BaseBotScheduleModel.RUNNING_TYPES_WITH_END_AT.includes(valuesMapRef.current.runningType)) {
            if (!valuesMapRef.current.endAt) {
                Toast.Add.error(t("bot.schedules.errors.Cron end time is required."));
                triggersMapRef.current.endAt?.focus();
                return;
            }
        }

        const promise = rescheduleBotCronMutateAsync({
            interval: valuesMapRef.current.interval,
            scope: target,
            running_type: valuesMapRef.current.runningType,
            start_at: valuesMapRef.current.startAt,
            end_at: valuesMapRef.current.endAt,
        });

        Toast.Add.promise(promise, {
            loading: t("bot.schedules.Rescheduling..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Bot rescheduled successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
            },
        });
    };

    return (
        <Popover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <Button size="sm" variant={variant} disabled={isValidating} className={className}>
                    {t("bot.schedules.Reschedule")}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-auto min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <BotScheduleListItemForm
                    initialValuesMap={{
                        runningType: runningType,
                        interval: intervalStr,
                        startAt: startAt,
                        endAt: endAt,
                    }}
                    valuesMapRef={valuesMapRef}
                    triggersMapRef={triggersMapRef}
                    disabled={isValidating}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={createSchedule} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BotScheduleListItemEdit;
