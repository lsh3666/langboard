import Button from "@/components/base/Button";
import { useCollaborativeText } from "@/components/Collaborative/useCollaborativeText";
import DateTimePicker from "@/components/base/DateTimePicker";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Skeleton from "@/components/base/Skeleton";
import Toast from "@/components/base/Toast";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { useBoardCardUnsavedActions } from "@/pages/BoardPage/components/card/BoardCardUnsavedProvider";
import { EEditorCollaborationType } from "@langboard/core/constants";
import { Utils } from "@langboard/core/utils";
import { memo, type PointerEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardDeadline() {
    return <Skeleton h={{ initial: "8", lg: "10" }} className="w-1/3" />;
}

const serializeDeadline = (value: Date | undefined) => {
    if (!value) {
        return "";
    }

    const nextValue = new Date(value);
    nextValue.setSeconds(0, 0);
    return nextValue.toISOString();
};

const parseDeadline = (value: string) => {
    if (!value) {
        return undefined;
    }

    const nextValue = new Date(value);
    if (Number.isNaN(nextValue.getTime())) {
        return undefined;
    }

    nextValue.setSeconds(0, 0);
    return nextValue;
};

const BoardCardDeadline = memo(() => {
    const { projectUID, card, hasRoleAction, isCardEditing } = useBoardCard();
    const [t] = useTranslation();
    const { markSectionDirty, resetSection, registerSectionSaveHandler, registerSectionCancelHandler } = useBoardCardUnsavedActions();
    const { mutateAsync: changeCardDetailsMutateAsync } = useChangeCardDetails("deadline_at", { interceptToast: true });
    const deadline = card.useField("deadline_at");
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [draftDeadline, setDraftDeadline] = useState<Date | undefined>(deadline);
    const canStartEditing = hasRoleAction(ProjectRole.EAction.CardUpdate) && isCardEditing;
    const editable = canStartEditing && isEditing;

    const getNormalizedTime = useCallback((value: Date | undefined) => {
        if (!value) {
            return null;
        }

        const nextValue = new Date(value);
        nextValue.setSeconds(0, 0);
        return nextValue.getTime();
    }, []);

    const updateDirtyState = useCallback(
        (nextDeadline: Date | undefined) => {
            markSectionDirty("deadline", getNormalizedTime(nextDeadline) !== getNormalizedTime(deadline));
        },
        [deadline, getNormalizedTime, markSectionDirty]
    );

    const { updateValue: updateCollaborativeDeadline } = useCollaborativeText({
        defaultValue: serializeDeadline(deadline),
        disabled: !editable,
        collaborationType: EEditorCollaborationType.Card,
        uid: card.uid,
        section: "deadline",
        field: "value",
        onValueChange: (nextValue) => {
            const nextDeadline = parseDeadline(nextValue);
            setDraftDeadline(nextDeadline);
            updateDirtyState(nextDeadline);
        },
    });

    const handleChange = useCallback(
        (date: Date | undefined) => {
            const nextDeadline = date ? new Date(date) : undefined;
            nextDeadline?.setSeconds(0, 0);
            updateCollaborativeDeadline(serializeDeadline(nextDeadline));
        },
        [updateCollaborativeDeadline]
    );

    const handleStartEditing = useCallback(
        (e: PointerEvent<HTMLSpanElement>) => {
            if (!canStartEditing) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            requestAnimationFrame(() => {
                setDraftDeadline(deadline);
                setIsEditing(true);
            });
        },
        [canStartEditing, deadline]
    );

    const handleClearDeadline = useCallback(() => {
        updateCollaborativeDeadline("");
    }, [updateCollaborativeDeadline]);

    const saveDeadline = useCallback(async () => {
        const nextDeadline = draftDeadline ? new Date(draftDeadline) : undefined;
        nextDeadline?.setSeconds(0, 0);

        if (getNormalizedTime(nextDeadline) === getNormalizedTime(deadline)) {
            resetSection("deadline");
            setIsEditing(false);
            return;
        }

        setIsSaving(true);

        const promise = changeCardDetailsMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            deadline_at: nextDeadline ?? "",
        });

        try {
            await Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler({}, messageRef);

                    handle(error);
                    return messageRef.message;
                },
                success: () => t("successes.Deadline changed successfully."),
            });

            resetSection("deadline");
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    }, [changeCardDetailsMutateAsync, deadline, draftDeadline, getNormalizedTime, projectUID, resetSection]);

    const cancelDeadlineEdit = useCallback(() => {
        setDraftDeadline(deadline);
        resetSection("deadline");
    }, [deadline, resetSection]);

    useEffect(() => {
        if (!isCardEditing) {
            setIsEditing(false);
            setDraftDeadline(deadline);
            resetSection("deadline");
        }
    }, [deadline, isCardEditing, resetSection]);

    useEffect(() => registerSectionSaveHandler("deadline", saveDeadline), [registerSectionSaveHandler, saveDeadline]);
    useEffect(() => registerSectionCancelHandler("deadline", cancelDeadlineEdit), [cancelDeadlineEdit, registerSectionCancelHandler]);

    return (
        <>
            {!editable ? (
                <span
                    className={cn(
                        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
                        "h-8 px-4 py-2 lg:h-10",
                        deadline ? "bg-primary text-primary-foreground shadow" : "border border-input bg-background shadow-sm",
                        canStartEditing && "cursor-pointer hover:opacity-90"
                    )}
                    onPointerDown={handleStartEditing}
                >
                    {deadline ? Utils.String.formatDateLocale(deadline) : t("card.No deadline")}
                </span>
            ) : (
                <Flex items="center">
                    <DateTimePicker
                        value={draftDeadline}
                        min={new Date(new Date().setMinutes(new Date().getMinutes() + 30))}
                        onChange={handleChange}
                        disabled={isSaving}
                        timePicker={{
                            hour: true,
                            minute: true,
                            second: false,
                        }}
                        renderTrigger={() => (
                            <Button
                                type="button"
                                variant={draftDeadline ? "default" : "outline"}
                                className={cn("h-8 gap-2 px-3 lg:h-10", draftDeadline && "rounded-r-none")}
                                title={t("card.Set deadline")}
                                disabled={isSaving}
                            >
                                <IconComponent icon="calendar" size="4" />
                                {draftDeadline ? Utils.String.formatDateLocale(draftDeadline) : t("card.Set deadline")}
                            </Button>
                        )}
                    />
                    {draftDeadline && (
                        <Button
                            variant="default"
                            className="h-8 gap-2 rounded-l-none border-l border-l-secondary/70 px-2 lg:h-10"
                            onClick={handleClearDeadline}
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
