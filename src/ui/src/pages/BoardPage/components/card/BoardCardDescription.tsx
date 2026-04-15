import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import Skeleton from "@/components/base/Skeleton";
import Toast from "@/components/base/Toast";
import { TEditor } from "@/components/Editor/editor-kit";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { BotModel, ProjectCard } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { getEditorStore } from "@/core/stores/EditorStore";
import { cn } from "@/core/utils/ComponentUtils";
import { useBoardCardUnsavedActions } from "@/pages/BoardPage/components/card/BoardCardUnsavedProvider";
import { CardEditControls } from "@/pages/BoardPage/components/card/CardEditControls";
import { EEditorType } from "@langboard/core/constants";
import { AIChatPlugin, AIPlugin } from "@platejs/ai/react";
import { memo, useCallback, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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

    const canEdit = hasRoleAction(ProjectRole.EAction.CardUpdate);
    const { valueRef, isEditing, changeMode, setIsEditing } = useChangeEditMode({
        canEdit: () => canEdit,
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
            <CardEditControls
                canEdit={canEdit}
                isEditing={isEditing}
                onEdit={() => changeMode("edit")}
                onSave={handleSave}
                onCancel={handleCancel}
                saveDisabled={isPending}
                className={cn("sticky top-[theme(spacing.16)] z-[90]", "mb-3 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm")}
            />
            {shouldCollapse ? (
                <CollapsibleDescriptionContent description={description} mentionables={mentionables} cards={cards} />
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
                        editorType={EEditorType.CardDescription}
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
}

const MAX_SHOW_LINES = 10;
const COLLAPSED_MAX_HEIGHT_CLASS = "max-h-[32rem]";
const EXPANDED_STEP_MAX_HEIGHT_CLASS = "max-h-[64rem]";

const CollapsibleDescriptionContent = memo((props: ICollapsibleDescriptionContentProps): React.JSX.Element => {
    const { description, mentionables, cards } = props;
    const [t] = useTranslation();
    const { projectUID, card, currentUser } = useBoardCard();
    const [expandMode, setExpandMode] = useState<"collapsed" | "expanded" | "all">("collapsed");
    const handleExpand = useCallback((e: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setExpandMode((prev) => (prev === "collapsed" ? "expanded" : "all"));
    }, []);
    const handleExpandAll = useCallback((e: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setExpandMode("all");
    }, []);

    return (
        <Box position="relative">
            <Box
                className={cn(
                    expandMode === "collapsed" && `${COLLAPSED_MAX_HEIGHT_CLASS} overflow-hidden`,
                    expandMode === "expanded" && `${EXPANDED_STEP_MAX_HEIGHT_CLASS} overflow-hidden`
                )}
            >
                <PlateEditor
                    value={description}
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
                    placeholder={t("card.No description")}
                    setValue={() => {}}
                />
            </Box>
            {expandMode !== "all" && (
                <>
                    <Box
                        position="absolute"
                        bottom="8"
                        left="0"
                        right="0"
                        z="50"
                        style={{ height: "120px" }}
                        className="pointer-events-none bg-gradient-to-t from-background to-transparent"
                    />
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
