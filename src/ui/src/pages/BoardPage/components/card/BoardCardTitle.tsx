import { Button, Dialog, Flex, IconComponent, Skeleton, Textarea, Toast } from "@/components/base";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { cn, setElementStyles } from "@/core/utils/ComponentUtils";
import BoardCardNotificationSettings from "@/pages/BoardPage/components/card/BoardCardNotificationSettings";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardTitle() {
    return (
        <Dialog.Title>
            <Skeleton h="8" className="w-1/3" />
        </Dialog.Title>
    );
}

function BoardCardTitle(): JSX.Element {
    const { setPageAliasRef } = usePageHeader();
    const { projectUID, card, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const { mutateAsync: changeCardDetailsMutateAsync } = useChangeCardDetails("title", { interceptToast: true });
    const title = card.useField("title");
    const canEdit = hasRoleAction(ProjectRole.EAction.CardUpdate);
    const titleSpanRef = useRef<HTMLSpanElement>(null);
    const editorName = `${card.uid}-card-title`;
    const [isOpened, setIsOpened] = useState(false);
    const [showCollapse, setShowCollapse] = useState(false);
    const { valueRef, height, isEditing, updateHeight, changeMode } = useChangeEditMode({
        canEdit: () => canEdit,
        valueType: "textarea",
        disableNewLine: true,
        editorName,
        save: (value, endCallback) => {
            const promise = changeCardDetailsMutateAsync({
                project_uid: projectUID,
                card_uid: card.uid,
                title: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler({}, messageRef);

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("successes.Title changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: title,
    });

    const handleClickTitle = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("[data-radix-popper-content-wrapper]")) {
            return;
        }

        changeMode("edit");
    };

    useEffect(() => {
        setPageAliasRef.current(title);
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

            if (truncatedHeight !== allTextedHeight) {
                setShowCollapse(() => true);
            } else {
                setShowCollapse(() => false);
            }
        }, 0);
    }, [title]);

    return (
        <Dialog.Title className="mr-7 cursor-text text-2xl" onClick={handleClickTitle}>
            {!isEditing ? (
                <Flex>
                    <span className={isOpened ? "" : "truncate"} ref={titleSpanRef}>
                        {title}
                    </span>
                    <Flex items="start" gap="1" ml="2.5">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setIsOpened(!isOpened)}
                            title={t(`card.${isOpened ? "Hide" : "Show"} title`)}
                            className={showCollapse ? "" : "hidden"}
                        >
                            <IconComponent icon="chevron-down" size="5" className={cn("transition-all", isOpened ? "rotate-180" : "")} />
                        </Button>
                        <BoardCardNotificationSettings key={`board-card-notification-settings-${card.uid}`} />
                    </Flex>
                </Flex>
            ) : (
                <Textarea
                    ref={valueRef}
                    className={cn(
                        "min-h-8 break-all rounded-none border-x-0 border-t-0 p-0 text-2xl scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    resize="none"
                    style={{ height }}
                    defaultValue={title}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onBlur={() => changeMode("view")}
                    onChange={updateHeight}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            changeMode("view");
                            return;
                        }
                    }}
                />
            )}
        </Dialog.Title>
    );
}

export default BoardCardTitle;
