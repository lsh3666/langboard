import Button from "@/components/base/Button";
import DateTimePicker from "@/components/base/DateTimePicker";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Skeleton from "@/components/base/Skeleton";
import SubmitButton from "@/components/base/SubmitButton";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardDeadline() {
    return <Skeleton h={{ initial: "8", lg: "10" }} className="w-1/3" />;
}

const BoardCardDeadline = memo(() => {
    const { projectUID, card, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const { mutate: changeCardDetailsMutate } = useChangeCardDetails("deadline_at");
    const deadline = card.useField("deadline_at");
    const [isSaving, setIsSaving] = useState(false);
    const editable = hasRoleAction(ProjectRole.EAction.CardUpdate);
    const changeDeadline = (date: Date | undefined) => {
        if (!editable || isSaving) {
            return;
        }

        if ((date as unknown as string) !== "") {
            if (deadline?.getTime() === date?.getTime()) {
                return;
            }
        }

        setIsSaving(true);

        changeCardDetailsMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                deadline_at: date,
            },
            {
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsSaving(false);
                },
            }
        );
    };

    const handleChange = (date: Date | undefined) => {
        date?.setSeconds(0);
        changeDeadline(date);
    };

    return (
        <>
            {!editable ? (
                <span
                    className={cn(
                        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
                        "h-8 px-4 py-2 lg:h-10",
                        deadline ? "bg-primary text-primary-foreground shadow" : "border border-input bg-background shadow-sm"
                    )}
                >
                    {deadline ? Utils.String.formatDateLocale(deadline) : t("card.No deadline")}
                </span>
            ) : (
                <Flex items="center">
                    <DateTimePicker
                        value={deadline}
                        min={new Date(new Date().setMinutes(new Date().getMinutes() + 30))}
                        onChange={handleChange}
                        disabled={isSaving}
                        timePicker={{
                            hour: true,
                            minute: true,
                            second: false,
                        }}
                        renderTrigger={() => (
                            <SubmitButton
                                type="button"
                                variant={deadline ? "default" : "outline"}
                                className={cn("h-8 gap-2 px-3 lg:h-10", deadline && "rounded-r-none")}
                                title={t("card.Set deadline")}
                                onClick={() => {}}
                                isValidating={isSaving}
                            >
                                <IconComponent icon="calendar" size="4" />
                                {deadline ? Utils.String.formatDateLocale(deadline) : t("card.Set deadline")}
                            </SubmitButton>
                        )}
                    />
                    {deadline && (
                        <Button
                            variant="default"
                            className="h-8 gap-2 rounded-l-none border-l border-l-secondary/70 px-2 lg:h-10"
                            onClick={() => changeDeadline("" as unknown as undefined)}
                            disabled={isSaving}
                        >
                            <IconComponent icon="trash-2" size="4" />
                        </Button>
                    )}
                </Flex>
            )}
        </>
    );
});

export default BoardCardDeadline;
