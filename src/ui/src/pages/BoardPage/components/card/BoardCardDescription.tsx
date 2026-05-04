import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import Skeleton from "@/components/base/Skeleton";
import Toast from "@/components/base/Toast";
import { TEditor } from "@/components/Editor/editor-kit";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel, ProjectCard } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { useBoardCardUnsavedActions } from "@/pages/BoardPage/components/card/BoardCardUnsavedProvider";
import { EEditorType } from "@langboard/core/constants";
import { AIChatPlugin, AIPlugin } from "@platejs/ai/react";
import { memo, startTransition, type MouseEvent, type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { toMarkdown } from "mdast-util-to-markdown";
import { gfmToMarkdown } from "mdast-util-gfm";
import { Utils } from "@langboard/core/utils";

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
    const { projectUID, card, currentUser, hasRoleAction, isCardEditing } = useBoardCard();
    const [t] = useTranslation();
    const { mutateAsync: changeCardDetailsMutateAsync, isPending } = useChangeCardDetails("description", { interceptToast: true });
    const editorRef = useRef<TEditor>(null);
    const projectMembers = card.useForeignFieldArray("project_members");
    const bots = BotModel.Model.useModels(() => true);
    const mentionables = useMemo(() => [...projectMembers, ...bots], [projectMembers, bots]);
    const cards = ProjectCard.Model.useModels((model) => model.uid !== card.uid && model.project_uid === projectUID, [projectUID, card]);
    const description = card.useField("description");
    const [isEditing, setIsEditing] = useState(false);
    const { markSectionDirty, resetSection, getHasUnsavedChanges, registerSectionSaveHandler, registerSectionCancelHandler } =
        useBoardCardUnsavedActions();
    const canEdit = hasRoleAction(ProjectRole.EAction.CardUpdate);
    const canStartEditing = canEdit && isCardEditing;
    const stopEditing = () => {
        if (!editorRef.current) {
            return;
        }

        const aiTransforms = editorRef.current.getTransforms(AIPlugin);
        const aiChatApi = editorRef.current.getApi(AIChatPlugin);
        aiChatApi.aiChat.stop();
        aiTransforms.ai.undo();
        aiChatApi.aiChat.hide();
    };

    const contentLines = description?.content?.split("\n").length ?? 0;
    const shouldCollapse = !isEditing && contentLines > MAX_COLLAPSE_LINES;
    const [visibleChunkCount, setVisibleChunkCount] = useState(1);
    const handleEditorChange = useCallback(
        (editor: TEditor) => {
            const hasContentChange = editor.operations.some((operation) => operation.type !== "set_selection");
            if (!hasContentChange) {
                return;
            }

            markSectionDirty("description", true);
        },
        [markSectionDirty]
    );

    const handleSave = useCallback(async () => {
        if (isPending) {
            return;
        }

        const nextContent = editorRef.current?.api.markdown.serialize()?.trim() ?? description?.content?.trim() ?? "";
        const originalContent = description?.content?.trim() ?? "";

        if (nextContent === originalContent) {
            resetSection("description");
            setIsEditing(false);
            return;
        }

        const promise = changeCardDetailsMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            description: {
                ...(description ?? {}),
                content: nextContent,
            },
        });

        await Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                resetSection("description");
                setIsEditing(false);
                return t("successes.Description changed successfully.");
            },
        });
    }, [changeCardDetailsMutateAsync, description, isPending, projectUID, resetSection]);

    const handleCancel = useCallback(() => {
        if (!isEditing) {
            return;
        }

        resetSection("description");
        stopEditing();
        setIsEditing(false);
    }, [isEditing, resetSection, stopEditing]);

    useEffect(() => {
        if (!isCardEditing && isEditing && !getHasUnsavedChanges()) {
            stopEditing();
            setIsEditing(false);
        }
    }, [getHasUnsavedChanges, isCardEditing, isEditing]);

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        requestAnimationFrame(() => {
            editorRef.current?.tf.focus();
        });
    }, [isEditing]);

    const handleStartEditing = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            if (!canStartEditing || isEditing) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            requestAnimationFrame(() => {
                setIsEditing(true);
            });
        },
        [canStartEditing, isEditing]
    );

    useEffect(() => registerSectionSaveHandler("description", handleSave), [handleSave, registerSectionSaveHandler]);
    useEffect(() => registerSectionCancelHandler("description", handleCancel), [handleCancel, registerSectionCancelHandler]);

    return (
        <Box
            data-card-description
            className={cn(canStartEditing && !isEditing && "cursor-text rounded-md transition-colors hover:bg-accent/20")}
            onPointerDown={handleStartEditing}
        >
            {shouldCollapse ? (
                <CollapsibleDescriptionContent
                    description={description}
                    mentionables={mentionables}
                    cards={cards}
                    visibleChunkCount={visibleChunkCount}
                    setVisibleChunkCount={setVisibleChunkCount}
                />
            ) : (
                <Box>
                    <PlateEditor
                        value={description}
                        mentionables={mentionables}
                        linkables={cards}
                        currentUser={currentUser}
                        containerClassName="overflow-y-visible"
                        className={cn("h-full min-h-[calc(theme(spacing.56)_-_theme(spacing.8))]", isEditing ? "px-6 py-3" : "")}
                        readOnly={!isEditing}
                        editorType={EEditorType.CardDescription}
                        form={{
                            project_uid: projectUID,
                            card_uid: card.uid,
                        }}
                        placeholder={!isEditing ? t("card.No description") : undefined}
                        setValue={() => {}}
                        onEditorChange={handleEditorChange}
                        serializeOnChange={false}
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
    visibleChunkCount: number;
    setVisibleChunkCount: React.Dispatch<React.SetStateAction<number>>;
}

const MAX_COLLAPSE_LINES = 10;
const MAX_CHUNK_BLOCKS = 10;
const MAX_HEAVY_LIST_ITEMS = 6;
const MAX_HEAVY_PARAGRAPH_LENGTH = 1200;
const SHOW_ALL_BATCH_SIZE = 2;

interface IMarkdownNode {
    type?: string;
    children?: IMarkdownNode[];
    value?: string;
    alt?: string | null;
}

function countMarkdownListItems(node: IMarkdownNode | undefined): number {
    if (!node?.children) {
        return 0;
    }

    return node.children.reduce((count, child) => {
        if (child?.type !== "listItem") {
            return count;
        }

        return count + 1;
    }, 0);
}

function getMarkdownTextLength(node: IMarkdownNode | undefined): number {
    if (!node) {
        return 0;
    }

    const ownLength = Utils.Type.isString(node.value) ? node.value.length : Utils.Type.isString(node.alt) ? node.alt.length : 0;
    if (!node.children?.length) {
        return ownLength;
    }

    return ownLength + node.children.reduce((length, child) => length + getMarkdownTextLength(child), 0);
}

function isHeavyMarkdownBlock(node: IMarkdownNode | undefined): bool {
    if (!node?.type) {
        return false;
    }

    if (node.type === "table" || node.type === "code" || node.type === "blockquote") {
        return true;
    }

    if (node.type === "list") {
        return countMarkdownListItems(node) >= MAX_HEAVY_LIST_ITEMS;
    }

    if (node.type === "paragraph") {
        return getMarkdownTextLength(node) >= MAX_HEAVY_PARAGRAPH_LENGTH;
    }

    return false;
}

const CollapsibleDescriptionContent = memo((props: ICollapsibleDescriptionContentProps): React.JSX.Element => {
    const { description, mentionables, cards, visibleChunkCount, setVisibleChunkCount } = props;
    const [t] = useTranslation();
    const { projectUID, card, currentUser } = useBoardCard();
    const chunkContents = useMemo(() => {
        const content = description?.content ?? "";

        if (!content.trim()) {
            return [{ content: "" }];
        }

        const root = unified().use(remarkParse).use(remarkGfm).parse(content) as { children?: IMarkdownNode[] };
        const children = Array.isArray(root.children) ? root.children : [];

        if (children.length === 0) {
            return [{ content }];
        }

        const chunks: IEditorContent[] = [];
        let currentChunk: IMarkdownNode[] = [];

        const pushChunk = (chunkChildren: IMarkdownNode[]) => {
            if (chunkChildren.length === 0) {
                return;
            }

            chunks.push({
                content: toMarkdown({ type: "root", children: chunkChildren } as never, {
                    extensions: [gfmToMarkdown()],
                }),
            });
        };

        for (const child of children) {
            if (isHeavyMarkdownBlock(child)) {
                pushChunk(currentChunk);
                currentChunk = [];
                pushChunk([child]);
                continue;
            }

            currentChunk.push(child);
            if (currentChunk.length >= MAX_CHUNK_BLOCKS) {
                pushChunk(currentChunk);
                currentChunk = [];
            }
        }

        pushChunk(currentChunk);

        return chunks;
    }, [description]);
    const totalChunkCount = Math.max(1, chunkContents.length);
    const showAllFrameRef = useRef<number | null>(null);
    const clampedVisibleChunkCount = Math.min(visibleChunkCount, totalChunkCount);
    const hasMoreContent = clampedVisibleChunkCount < totalChunkCount;

    useEffect(() => {
        return () => {
            if (showAllFrameRef.current !== null) {
                cancelAnimationFrame(showAllFrameRef.current);
            }
        };
    }, []);

    const createChunk = useCallback(
        (chunkIndex: number) => {
            const chunkContent = chunkContents[chunkIndex] ?? { content: "" };

            return (
                <PlateEditor
                    key={chunkIndex}
                    value={chunkContent}
                    mentionables={mentionables}
                    linkables={cards}
                    currentUser={currentUser}
                    containerClassName="overflow-y-visible"
                    className="h-full min-h-0"
                    readOnly
                    editorType={EEditorType.CardDescription}
                    form={{
                        project_uid: projectUID,
                        card_uid: card.uid,
                    }}
                    placeholder={chunkIndex === 0 ? t("card.No description") : undefined}
                    setValue={() => {}}
                />
            );
        },
        [chunkContents, mentionables, cards, currentUser, projectUID, card]
    );

    const handleExpand = useCallback((e: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setVisibleChunkCount((prev) => prev + 1);
    }, []);
    const handleExpandAll = useCallback(
        (e: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>) => {
            e.stopPropagation();
            e.preventDefault();

            if (showAllFrameRef.current !== null) {
                cancelAnimationFrame(showAllFrameRef.current);
            }

            const expandNext = () => {
                startTransition(() => {
                    setVisibleChunkCount((prev) => {
                        const next = Math.min(prev + SHOW_ALL_BATCH_SIZE, totalChunkCount);

                        if (next < totalChunkCount) {
                            showAllFrameRef.current = requestAnimationFrame(expandNext);
                        } else {
                            showAllFrameRef.current = null;
                        }

                        return next;
                    });
                });
            };

            expandNext();
        },
        [totalChunkCount]
    );

    return (
        <Box position="relative">
            {Array.from({ length: clampedVisibleChunkCount }, (_, chunkIndex) => createChunk(chunkIndex))}
            {hasMoreContent && (
                <>
                    <Flex position="relative" justify="center" pb="2" z="50" gap="3" wrap>
                        <Flex
                            inline
                            items="center"
                            gap="1"
                            textSize="sm"
                            weight="semibold"
                            className="text-accent-foreground/70 transition-colors hover:text-accent-foreground"
                            cursor="pointer"
                            onPointerDown={handleExpand}
                        >
                            {t("editor.Show more")}
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </Flex>
                        <Flex
                            inline
                            items="center"
                            gap="1"
                            textSize="sm"
                            weight="semibold"
                            className="text-accent-foreground/70 transition-colors hover:text-accent-foreground"
                            cursor="pointer"
                            onPointerDown={handleExpandAll}
                        >
                            {t("editor.Show all")}
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                            </svg>
                        </Flex>
                    </Flex>
                </>
            )}
        </Box>
    );
});

export default BoardCardDescription;
