import { Box, Button, Flex, Skeleton, Toast } from "@/components/base";
import { TEditor } from "@/components/Editor/editor-kit";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeWikiDetails from "@/controllers/api/wiki/useChangeWikiDetails";
import useBoardUIWikiDeletedHandlers from "@/controllers/socket/wiki/useBoardUIWikiDeletedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import useToggleEditingByClickOutside from "@/core/hooks/useToggleEditingByClickOutside";
import { BotModel, ProjectWiki } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import WikiPrivateOption, { SkeletonWikiPrivateOption } from "@/pages/BoardPage/components/wiki/WikiPrivateOption";
import WikiTitle from "@/pages/BoardPage/components/wiki/WikiTitle";
import { EHttpStatus } from "@langboard/core/enums";
import { AIChatPlugin, AIPlugin } from "@platejs/ai/react";
import { memo, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiContentProps {
    wiki: ProjectWiki.TModel;
}

export function SkeletonWikiContent() {
    return (
        <Box mt="2">
            <SkeletonWikiPrivateOption />
            <Box p="2">
                <Skeleton h="8" className="w-2/3 md:w-1/3" />
            </Box>
            <Box position="relative" px="6" py="3" className="min-h-[calc(100vh_-_theme(spacing.56))]">
                <Skeleton position="absolute" className="h-3/5 w-4/5 md:w-3/5" />
            </Box>
        </Box>
    );
}

const WikiContent = memo(({ wiki }: IWikiContentProps) => {
    const navigate = usePageNavigateRef();
    const { project, wikis: flatWikis, socket, projectMembers, currentUser, changeTab } = useBoardWiki();
    const [t] = useTranslation();
    const { mutateAsync: changeWikiDetailsMutateAsync } = useChangeWikiDetails("content", { interceptToast: true });
    const editorName = `${wiki.uid}-wiki-description`;
    const isPublic = wiki.useField("is_public");
    const assignedMembers = wiki.useForeignField("assigned_members");
    const bots = BotModel.Model.useModels(() => true);
    const wikis = useMemo(() => flatWikis.filter((w) => w.uid !== wiki.uid), [flatWikis, wiki]);
    const mentionables = useMemo(
        () => [...(isPublic ? projectMembers : assignedMembers), ...bots],
        [isPublic, assignedMembers, projectMembers, bots]
    );
    const content = wiki.useField("content");
    const editorRef = useRef<TEditor>(null);
    const { valueRef, isEditing, setIsEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        customStartEditing: () => {
            setTimeout(() => {
                editorRef.current?.tf.focus();
            }, 0);
        },
        valueType: "editor",
        canEmpty: true,
        editorName,
        save: (value) => {
            const promise = changeWikiDetailsMutateAsync({
                project_uid: project.uid,
                wiki_uid: wiki.uid,
                content: value,
            });

            Toast.Add.promise(promise, {
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
                success: () => {
                    return t("successes.Content changed successfully.");
                },
                finally: () => {
                    setIsEditing(false);
                },
            });
        },
        originalValue: content,
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
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const { startEditing, stopEditing } = useToggleEditingByClickOutside("[data-wiki-content]", changeMode, isEditing);
    const boardUIWikiDeletedHandlers = useMemo(
        () =>
            useBoardUIWikiDeletedHandlers({
                projectUID: project.uid,
                wiki,
                callback: () => {
                    navigate(ROUTES.BOARD.WIKI(project.uid));
                },
            }),
        []
    );

    useSwitchSocketHandlers({
        socket,
        handlers: boardUIWikiDeletedHandlers,
        dependencies: [boardUIWikiDeletedHandlers],
    });

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        window.addEventListener("pointerdown", stopEditing);

        return () => {
            window.removeEventListener("pointerdown", stopEditing);
        };
    }, [isEditing]);

    return (
        <Box className="max-h-[calc(100vh_-_theme(spacing.36))] overflow-y-auto">
            <WikiPrivateOption wiki={wiki} changeTab={changeTab} />
            <WikiTitle wiki={wiki} />
            <Box onPointerDown={startEditing} position="relative" data-wiki-content>
                <PlateEditor
                    value={content}
                    currentUser={currentUser}
                    mentionables={mentionables}
                    linkables={wikis}
                    className={cn(
                        "h-full px-6 py-3",
                        isEditing
                            ? cn(
                                  "max-h-[calc(100vh_-_theme(spacing.72)_-_theme(spacing.6)_-_1px)]",
                                  "min-h-[calc(100vh_-_theme(spacing.72)_-_theme(spacing.6)_-_1px)]"
                              )
                            : "max-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.5))] min-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.5))]"
                    )}
                    readOnly={!isEditing}
                    editorType="wiki-content"
                    form={{
                        project_uid: project.uid,
                        wiki_uid: wiki.uid,
                    }}
                    placeholder={!isEditing ? t("wiki.No content") : undefined}
                    setValue={setValue}
                    editorRef={editorRef}
                />
            </Box>
            <Flex items="center" justify="start" pt="2" mx="2" gap="2" className="border-t">
                <Button variant="secondary" onClick={() => navigate(ROUTES.BOARD.WIKI_ACTIVITY(project.uid, wiki.uid))}>
                    {t("board.Activity")}
                </Button>
                <Button variant="secondary" onClick={() => navigate(ROUTES.BOARD.WIKI_METADATA(project.uid, wiki.uid))}>
                    {t("metadata.Metadata")}
                </Button>
            </Flex>
        </Box>
    );
});

export default WikiContent;
