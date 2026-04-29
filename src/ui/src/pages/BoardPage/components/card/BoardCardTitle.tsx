import Dialog from "@/components/base/Dialog";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Skeleton from "@/components/base/Skeleton";
import Button from "@/components/base/Button";
import Toast from "@/components/base/Toast";
import Collaborative from "@/components/Collaborative";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { cn, measureTextAreaHeight, setElementStyles } from "@/core/utils/ComponentUtils";
import { useBoardCardUnsavedActions } from "@/pages/BoardPage/components/card/BoardCardUnsavedProvider";
import BoardCardNotificationSettings from "@/pages/BoardPage/components/card/BoardCardNotificationSettings";
import { EEditorCollaborationType } from "@langboard/core/constants";
import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardTitle() {
    return (
        <Dialog.Title>
            <Skeleton h="8" className="w-1/3" />
        </Dialog.Title>
    );
}

function BoardCardTitle(): React.JSX.Element {
    const { setPageAliasRef } = usePageHeader();
    const { projectUID, card, isCardEditing, canEditCard } = useBoardCard();
    const [t] = useTranslation();
    const { markSectionDirty, resetSection, registerSectionSaveHandler, registerSectionCancelHandler } = useBoardCardUnsavedActions();
    const { mutateAsync: changeCardDetailsMutateAsync } = useChangeCardDetails("title", { interceptToast: true });
    const title = card.useField("title");
    const titleSpanRef = useRef<HTMLSpanElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [draftTitle, setDraftTitle] = useState(title);
    const [height, setHeight] = useState(0);
    const [isOpened, setIsOpened] = useState(false);
    const [showCollapse, setShowCollapse] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const canStartEditing = canEditCard && isCardEditing;

    const syncHeight = useCallback(() => {
        if (!textareaRef.current) {
            return;
        }

        setHeight(measureTextAreaHeight(textareaRef.current));
    }, []);

    const handleStartEditing = useCallback(
        (e: PointerEvent<HTMLSpanElement>) => {
            if (!canStartEditing) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            requestAnimationFrame(() => {
                setIsEditing(true);
            });
        },
        [canStartEditing]
    );

    const handleToggleOpened = useCallback(() => {
        setIsOpened((prev) => !prev);
    }, []);

    const handleTitleValueChange = useCallback(
        (nextTitle: string) => {
            setDraftTitle(nextTitle);
            markSectionDirty("title", nextTitle.trim() !== title.trim());
            requestAnimationFrame(syncHeight);
        },
        [markSectionDirty, syncHeight, title]
    );

    const handleTitleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter") {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
    }, []);

    const saveTitle = useCallback(async () => {
        const nextTitle = draftTitle.trim();
        const originalTitle = title.trim();
        if (!nextTitle || nextTitle === originalTitle) {
            setDraftTitle(title);
            resetSection("title");
            return;
        }

        const promise = changeCardDetailsMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            title: nextTitle,
        });

        await Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => t("successes.Title changed successfully."),
        });
        resetSection("title");
    }, [changeCardDetailsMutateAsync, draftTitle, projectUID, resetSection, title]);

    const cancelTitleEdit = useCallback(() => {
        setDraftTitle(title);
        resetSection("title");
    }, [resetSection, title]);

    useEffect(() => {
        setPageAliasRef.current(title);
    }, [title]);

    useEffect(() => {
        if (!isCardEditing) {
            setIsEditing(false);
            setDraftTitle(title);
            resetSection("title");
        }
    }, [isCardEditing, resetSection, title]);

    useLayoutEffect(() => {
        if (!isEditing) {
            return;
        }

        syncHeight();
        textareaRef.current?.focus();
    }, [isEditing, syncHeight]);

    useEffect(() => {
        setTimeout(() => {
            if (!titleSpanRef.current) {
                return;
            }

            const truncatedCloned = titleSpanRef.current.cloneNode(true) as HTMLSpanElement;
            truncatedCloned.classList.add("truncate", "text-2xl", "font-semibold", "tracking-tight");

            const allTextedCloned = titleSpanRef.current.cloneNode(true) as HTMLSpanElement;
            allTextedCloned.classList.add("text-2xl", "font-semibold", "tracking-tight");
            allTextedCloned.classList.remove("truncate");

            const width = titleSpanRef.current.offsetWidth;
            setElementStyles([truncatedCloned, allTextedCloned], {
                display: "block",
                position: "absolute",
                visibility: "hidden",
                zIndex: "-1",
                maxWidth: `${width}px`,
                width: "100%",
            });

            document.body.appendChild(truncatedCloned);
            document.body.appendChild(allTextedCloned);

            const truncatedHeight = truncatedCloned.offsetHeight;
            const allTextedHeight = allTextedCloned.offsetHeight;

            document.body.removeChild(truncatedCloned);
            document.body.removeChild(allTextedCloned);
            truncatedCloned.remove();
            allTextedCloned.remove();

            setShowCollapse(truncatedHeight !== allTextedHeight);
        }, 0);
    }, [title]);

    useEffect(() => registerSectionSaveHandler("title", saveTitle), [registerSectionSaveHandler, saveTitle]);
    useEffect(() => registerSectionCancelHandler("title", cancelTitleEdit), [cancelTitleEdit, registerSectionCancelHandler]);

    return (
        <Dialog.Title className="mr-7 text-2xl">
            {!isEditing ? (
                <Flex>
                    <span
                        className={cn(isOpened ? "" : "truncate", canStartEditing && "cursor-text rounded-sm hover:bg-accent/40")}
                        ref={titleSpanRef}
                        onPointerDown={handleStartEditing}
                    >
                        {title}
                    </span>
                    <Flex items="start" gap="1" ml="2.5">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleToggleOpened}
                            title={t(`card.${isOpened ? "Hide" : "Show"} title`)}
                            className={showCollapse ? "" : "hidden"}
                        >
                            <IconComponent icon="chevron-down" size="5" className={cn("transition-all", isOpened ? "rotate-180" : "")} />
                        </Button>
                        <BoardCardNotificationSettings key={`board-card-notification-settings-${card.uid}`} />
                    </Flex>
                </Flex>
            ) : (
                <Collaborative.Textarea
                    ref={textareaRef}
                    collaborationType={EEditorCollaborationType.CardTitle}
                    uid={card.uid}
                    field="title"
                    defaultValue={title}
                    className={cn(
                        "min-h-8 break-all rounded-none border-x-0 border-t-0 p-0 text-2xl scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    resize="none"
                    style={{ height }}
                    onValueChange={handleTitleValueChange}
                    onKeyDown={handleTitleKeyDown}
                />
            )}
        </Dialog.Title>
    );
}

export default BoardCardTitle;
