import Box from "@/components/base/Box";
import Collaborative from "@/components/Collaborative";
import Toast from "@/components/base/Toast";
import useChangeWikiDetails from "@/controllers/api/wiki/useChangeWikiDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn, measureTextAreaHeight } from "@/core/utils/ComponentUtils";
import { EEditorCollaborationType } from "@langboard/core/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { KeyboardEvent, PointerEvent, memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBoardWikiUnsavedActions } from "@/pages/BoardPage/components/wiki/BoardWikiUnsavedProvider";

export interface IWikiTitleProps {
    wiki: ProjectWiki.TModel;
}

const WikiTitle = memo(({ wiki }: IWikiTitleProps) => {
    const navigate = usePageNavigateRef();
    const { project, canEditWiki, isWikiEditing } = useBoardWiki();
    const [t] = useTranslation();
    const { markSectionDirty, resetSection, registerSectionSaveHandler, registerSectionCancelHandler } = useBoardWikiUnsavedActions();
    const { mutateAsync: changeWikiDetailsMutateAsync } = useChangeWikiDetails("title", { interceptToast: true });
    const title = wiki.useField("title");
    const forbidden = wiki.useField("forbidden");
    const canStartEditing = isWikiEditing && canEditWiki(wiki.uid) && !forbidden;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [draftTitle, setDraftTitle] = useState(title);
    const [height, setHeight] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const syncHeight = useCallback(() => {
        if (!textareaRef.current) {
            return;
        }

        setHeight(measureTextAreaHeight(textareaRef.current));
    }, []);

    const saveTitle = useCallback(async () => {
        const nextTitle = draftTitle.trim();
        const originalTitle = title.trim();

        if (!nextTitle || nextTitle === originalTitle) {
            setDraftTitle(title);
            resetSection("title");
            return;
        }

        const promise = changeWikiDetailsMutateAsync({
            project_uid: project.uid,
            wiki_uid: wiki.uid,
            title: nextTitle,
        });

        await Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.BOARD.WIKI(project.uid)),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => t("successes.Title changed successfully."),
        });

        resetSection("title");
    }, [changeWikiDetailsMutateAsync, draftTitle, project, resetSection, title, wiki]);

    const cancelTitleEdit = useCallback(() => {
        setDraftTitle(title);
        resetSection("title");
    }, [resetSection, title]);

    const handleStartEditing = useCallback(
        (e: PointerEvent<HTMLHeadingElement>) => {
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

    const handleTitleValueChange = useCallback(
        (nextTitle: string) => {
            setDraftTitle(nextTitle);
            markSectionDirty("title", nextTitle.trim() !== title.trim());
            window.requestAnimationFrame(syncHeight);
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

    useLayoutEffect(() => {
        if (!isEditing) {
            return;
        }

        syncHeight();
        textareaRef.current?.focus();
    }, [isEditing, syncHeight]);

    useEffect(() => {
        if (isEditing) {
            return;
        }

        setDraftTitle(title);
    }, [isEditing, title]);

    useEffect(() => {
        if (!isWikiEditing) {
            setIsEditing(false);
            setDraftTitle(title);
            resetSection("title");
        }
    }, [isWikiEditing, resetSection, title]);

    useEffect(() => registerSectionSaveHandler("title", saveTitle), [registerSectionSaveHandler, saveTitle]);
    useEffect(() => registerSectionCancelHandler("title", cancelTitleEdit), [cancelTitleEdit, registerSectionCancelHandler]);

    useEffect(() => {
        if (isWikiEditing || !isEditing) {
            return;
        }

        setIsEditing(false);
    }, [isEditing, isWikiEditing]);

    return (
        <Box p="2">
            {!isEditing ? (
                <h1
                    className={cn("min-h-8 break-all border-b border-border text-xl md:text-2xl", canStartEditing ? "cursor-text" : "cursor-default")}
                    onPointerDown={handleStartEditing}
                >
                    {title}
                </h1>
            ) : (
                <Collaborative.Textarea
                    ref={textareaRef}
                    collaborationType={EEditorCollaborationType.WikiTitle}
                    uid={wiki.uid}
                    field="title"
                    className={cn(
                        "min-h-8 break-all rounded-none border-x-0 border-t-0 p-0 pb-px text-xl md:text-2xl",
                        "scrollbar-hide focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    resize="none"
                    style={{ height }}
                    defaultValue={title}
                    onValueChange={handleTitleValueChange}
                    onKeyDown={handleTitleKeyDown}
                />
            )}
        </Box>
    );
});

export default WikiTitle;
