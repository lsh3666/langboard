import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import Skeleton from "@/components/base/Skeleton";
import Toast from "@/components/base/Toast";
import { TEditor } from "@/components/Editor/editor-kit";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import useToggleEditingByClickOutside from "@/core/hooks/useToggleEditingByClickOutside";
import { BotModel, ProjectCard } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { getEditorStore } from "@/core/stores/EditorStore";
import { cn } from "@/core/utils/ComponentUtils";
import { useBoardCardUnsavedActions } from "@/pages/BoardPage/components/card/BoardCardUnsavedProvider";
import { CardEditControls } from "@/pages/BoardPage/components/card/CardEditControls";
import { AIChatPlugin, AIPlugin } from "@platejs/ai/react";
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const isMarkdownListLine = (line: string): boolean => /^\s*(?:[-*+]|\d+\.)\s+/.test(line);
const isMarkdownListContinuationLine = (line: string): boolean => /^\s{2,}\S/.test(line);
const isMarkdownTableLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^\s*\|.*\|\s*$/.test(line)) return true;
    return trimmed.includes("|") && !isMarkdownListLine(line);
};

const extendEndForMarkdownBlock = (lines: string[], start: number, end: number): number => {
    let adjustedEnd = Math.min(end, lines.length);
    if (adjustedEnd <= start) {
        return adjustedEnd;
    }

    const lastLine = lines[adjustedEnd - 1];

    if (isMarkdownTableLine(lastLine)) {
        while (adjustedEnd < lines.length && isMarkdownTableLine(lines[adjustedEnd])) {
            adjustedEnd += 1;
        }
        return adjustedEnd;
    }

    if (isMarkdownListLine(lastLine) || isMarkdownListContinuationLine(lastLine)) {
        while (adjustedEnd < lines.length) {
            const nextLine = lines[adjustedEnd];
            const nextIsList = isMarkdownListLine(nextLine) || isMarkdownListContinuationLine(nextLine);
            const blankFollowedByList =
                nextLine.trim() === "" &&
                adjustedEnd + 1 < lines.length &&
                (isMarkdownListLine(lines[adjustedEnd + 1]) || isMarkdownListContinuationLine(lines[adjustedEnd + 1]));

            if (!nextIsList && !blankFollowedByList) {
                break;
            }

            adjustedEnd += 1;
        }
    }

    return adjustedEnd;
};

export function SkeletonBoardCardDescription() {
    return (
        <Box>
            <Box h="full" className="min-h-[calc(theme(spacing.56)_-_theme(spacing.8))] text-muted-foreground">
                <Skeleton w="full" className="h-[calc(theme(spacing.56)_-_theme(spacing.8))]" />
            </Box>
        </Box>
    );
}

const BoardCardDescription = memo((): React.JSX.Element => {
    const { projectUID, card, currentUser, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const { mutateAsync: changeCardDetailsMutateAsync, isPending } = useChangeCardDetails("description", { interceptToast: true });
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const editorRef = useRef<TEditor>(null);
    const editorName = `${card.uid}-card-description`;
    const projectMembers = card.useForeignFieldArray("project_members");
    const bots = BotModel.Model.useModels(() => true);
    const mentionables = useMemo(() => [...projectMembers, ...bots], [projectMembers, bots]);
    const cards = ProjectCard.Model.useModels((model) => model.uid !== card.uid && model.project_uid === projectUID, [projectUID, card]);
    const description = card.useField("description");
    const { markSectionDirty, resetSection, getHasUnsavedChanges } = useBoardCardUnsavedActions();

    const { valueRef, isEditing, changeMode, setIsEditing } = useChangeEditMode({
        canEdit: () => hasRoleAction(ProjectRole.EAction.CardUpdate),
        valueType: "editor",
        canEmpty: true,
        editorName,
        customStartEditing: () => {
            setTimeout(() => {
                editorRef.current?.tf.focus();
            }, 0);
        },
        save: (value) => {
            const promise = changeCardDetailsMutateAsync({
                project_uid: projectUID,
                card_uid: card.uid,
                description: value,
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
                    resetSection("description");
                    return t("successes.Description changed successfully.");
                },
                finally: () => {
                    getEditorStore().setCurrentEditor(null);
                },
            });
        },
        originalValue: description,
        onStopEditing: () => {
            if (!editorRef.current) {
                return;
            }

            const aiTransforms = editorRef.current.getTransforms(AIPlugin);
            const aiChatApi = editorRef.current.getApi(AIChatPlugin);
            aiChatApi.aiChat.stop();
            aiTransforms.ai.undo();
            aiChatApi.aiChat.hide();
        },
    });

    const contentLines = description?.content?.split("\n").length ?? 0;
    const shouldCollapse = !isEditing && contentLines > MAX_SHOW_LINES;

    const setValue = useCallback(
        (value: IEditorContent) => {
            valueRef.current = value;
        },
        [valueRef]
    );
    const { startEditing } = useToggleEditingByClickOutside("[data-card-description]", changeMode, isEditing);

    const handleEditorValueChange = useCallback(
        (value: IEditorContent) => {
            setValue(value);
            const nextContent = value?.content ?? "";
            const originalContent = description?.content ?? "";
            const nextDirty = nextContent !== originalContent;

            markSectionDirty("description", nextDirty);
        },
        [description, markSectionDirty, setValue]
    );

    const handleSave = useCallback(() => {
        if (!getHasUnsavedChanges() || isPending) {
            return;
        }

        changeMode("view");
    }, [changeMode, getHasUnsavedChanges, isPending]);

    const handleCancel = useCallback(() => {
        if (!isEditing) {
            return;
        }

        setValue(description);
        resetSection("description");
        forceUpdate();
        setIsEditing(false);
        getEditorStore().setCurrentEditor(null);
    }, [description, isEditing, resetSection, setIsEditing, setValue]);

    const displayValue = description;

    return (
        <Box data-card-description>
            {isEditing && (
                <CardEditControls
                    isEditing={isEditing}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    saveDisabled={isPending}
                    className={cn(
                        "sticky top-[theme(spacing.16)] z-[90]",
                        "mb-3 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm"
                    )}
                />
            )}
            {shouldCollapse ? (
                <CollapsibleDescriptionContent description={description} mentionables={mentionables} cards={cards} onPointerDown={startEditing} />
            ) : (
                <Box>
                    <PlateEditor
                        value={displayValue}
                        mentionables={mentionables}
                        linkables={cards}
                        currentUser={currentUser}
                        containerClassName="overflow-y-visible"
                        className={cn("h-full min-h-[calc(theme(spacing.56)_-_theme(spacing.8))]", isEditing ? "px-6 py-3" : "")}
                        readOnly={!isEditing}
                        editorType="card-description"
                        form={{
                            project_uid: projectUID,
                            card_uid: card.uid,
                        }}
                        placeholder={!isEditing ? t("card.No description") : undefined}
                        setValue={handleEditorValueChange}
                        editorRef={editorRef}
                    />
                </Box>
            )}
        </Box>
    );
});

interface ICollapsibleDescriptionContentProps {
    description: IEditorContent | undefined;
    mentionables: TUserLikeModel[];
    cards: ProjectCard.TModel[];
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const MAX_SHOW_LINES = 10;

const CollapsibleDescriptionContent = memo((props: ICollapsibleDescriptionContentProps): React.JSX.Element => {
    const { description, mentionables, cards, onPointerDown } = props;
    const [t] = useTranslation();
    const { projectUID, card, currentUser } = useBoardCard();
    const [visibleLineCount, setVisibleLineCount] = useState(MAX_SHOW_LINES);
    const [loadedChunks, setLoadedChunks] = useState<Map<number, React.ReactNode>>(new Map());
    const loadedChunksRef = useRef(loadedChunks);
    const [gradientHeight, setGradientHeight] = useState(96);
    const contentWrapperRef = useRef<HTMLDivElement>(null);

    loadedChunksRef.current = loadedChunks;

    const sliceContent = useCallback((start: number, end: number, content: string = ""): { content: IEditorContent; end: number } => {
        const lines = content.split("\n");
        const adjustedEnd = extendEndForMarkdownBlock(lines, start, end);
        return {
            content: { content: lines.slice(start, adjustedEnd).join("\n") },
            end: adjustedEnd,
        };
    }, []);

    const contentLines = description?.content?.split("\n").length ?? 0;
    const totalUnits = contentLines;

    const handleExpanded = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            e.preventDefault();

            const nextChunkIndex = loadedChunksRef.current.size;
            const nextStart = visibleLineCount;
            const nextEnd = nextStart + MAX_SHOW_LINES;
            const chunkSlice = sliceContent(nextStart, nextEnd, description?.content);

            if (!loadedChunksRef.current.has(nextChunkIndex)) {
                const chunk = (
                    <PlateEditor
                        key={nextChunkIndex}
                        value={chunkSlice.content}
                        mentionables={mentionables}
                        linkables={cards}
                        currentUser={currentUser}
                        containerClassName="overflow-y-visible"
                        className="h-full min-h-0"
                        readOnly
                        editorType="card-description"
                        form={{
                            project_uid: projectUID,
                            card_uid: card.uid,
                        }}
                        setValue={() => {}}
                    />
                );

                setLoadedChunks((prev) => {
                    const newMap = new Map(prev);
                    newMap.set(nextChunkIndex, chunk);
                    return newMap;
                });
            }

            setVisibleLineCount(chunkSlice.end);
        },
        [visibleLineCount, description, mentionables, cards, currentUser, projectUID, card, sliceContent]
    );

    useEffect(() => {
        if (!contentWrapperRef.current) {
            return;
        }

        const updateGradientHeight = () => {
            const contentHeight = contentWrapperRef.current?.offsetHeight ?? 0;
            const maxGradientHeight = 200;
            const minGradientHeight = 80;
            const calculatedHeight = Math.max(Math.min(contentHeight * 0.4, maxGradientHeight), minGradientHeight);
            setGradientHeight(calculatedHeight);
        };

        updateGradientHeight();

        const resizeObserver = new ResizeObserver(updateGradientHeight);
        if (contentWrapperRef.current) {
            resizeObserver.observe(contentWrapperRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [loadedChunks]);

    useEffect(() => {
        const chunk0Slice = sliceContent(0, MAX_SHOW_LINES, description?.content);
        const chunk0 = (
            <PlateEditor
                key={0}
                value={chunk0Slice.content}
                mentionables={mentionables}
                linkables={cards}
                currentUser={currentUser}
                containerClassName="overflow-y-visible"
                readOnly
                editorType="card-description"
                form={{
                    project_uid: projectUID,
                    card_uid: card.uid,
                }}
                placeholder={t("card.No description")}
                setValue={() => {}}
            />
        );

        setLoadedChunks(new Map([[0, chunk0]]));
        setVisibleLineCount(chunk0Slice.end);
    }, [description, mentionables, cards, currentUser, projectUID, card, sliceContent]);

    const hasMoreContent = visibleLineCount < totalUnits;

    return (
        <Box onPointerDown={onPointerDown} position="relative" ref={contentWrapperRef}>
            {Array.from(loadedChunks.entries())
                .sort(([a], [b]) => a - b)
                .map(([_, chunk]) => chunk)}
            {hasMoreContent && (
                <>
                    <Box
                        position="absolute"
                        bottom="8"
                        left="0"
                        right="0"
                        z="50"
                        style={{ height: `${gradientHeight}px` }}
                        className="pointer-events-none bg-gradient-to-t from-background to-transparent"
                    />
                    <Flex position="relative" justify="center" pb="2" z="50" cursor="pointer" onPointerDown={handleExpanded}>
                        <Flex
                            inline
                            items="center"
                            gap="1"
                            textSize="sm"
                            weight="semibold"
                            className="text-accent-foreground/70 transition-colors hover:text-accent-foreground"
                        >
                            {t("editor.Show more")}
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </Flex>
                    </Flex>
                </>
            )}
        </Box>
    );
});

export default BoardCardDescription;
