import { Box, Skeleton, Toast } from "@/components/base";
import { TEditor } from "@/components/Editor/editor-kit";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import useToggleEditingByClickOutside from "@/core/hooks/useToggleEditingByClickOutside";
import { BotModel, Project, ProjectCard } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { getEditorStore } from "@/core/stores/EditorStore";
import { cn } from "@/core/utils/ComponentUtils";
import { useBoardCardUnsavedActions } from "@/pages/BoardPage/components/card/BoardCardUnsavedProvider";
import { CardEditControls } from "@/pages/BoardPage/components/card/CardEditControls";
import { AIChatPlugin, AIPlugin } from "@platejs/ai/react";
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
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

const BoardCardDescription = memo((): JSX.Element => {
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
        canEdit: () => hasRoleAction(Project.ERoleAction.CardUpdate),
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

    const setValue = useCallback(
        (value: IEditorContent) => {
            valueRef.current = value;
        },
        [valueRef]
    );
    const { startEditing } = useToggleEditingByClickOutside("[data-card-description]", changeMode, isEditing);
    const [initialEditorValue, setInitialEditorValue] = useState(description);

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

    useEffect(() => {
        if (isEditing) {
            return;
        }

        setInitialEditorValue(description);
        setValue(description);
        resetSection("description");
        forceUpdate();
    }, [description, isEditing, resetSection, setValue]);

    return (
        <Box data-card-description>
            {isEditing && <CardEditControls isEditing={isEditing} onSave={handleSave} onCancel={handleCancel} saveDisabled={isPending} />}
            <Box onPointerDown={startEditing}>
                <PlateEditor
                    value={initialEditorValue}
                    mentionables={mentionables}
                    linkables={cards}
                    currentUser={currentUser}
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
        </Box>
    );
});

export default BoardCardDescription;
