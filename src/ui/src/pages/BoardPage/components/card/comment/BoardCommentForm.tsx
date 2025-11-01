import { Box, Button, Drawer, Flex, Form, Skeleton, SubmitButton } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "react-i18next";
import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { PlateEditor } from "@/components/Editor/plate-editor";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import useAddCardComment from "@/controllers/api/card/comment/useAddCardComment";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useToggleEditingByClickOutside from "@/core/hooks/useToggleEditingByClickOutside";
import { isModel, TUserLikeModel } from "@/core/models/ModelRegistry";
import { BotModel, ProjectCard } from "@/core/models";
import { getEditorStore, useIsCurrentEditor } from "@/core/stores/EditorStore";
import { TEditor } from "@/components/Editor/editor-kit";
import { getMentionOnSelectItem } from "@platejs/mention";

export function SkeletonBoardCommentForm() {
    return (
        <Box
            position="sticky"
            bottom={{ initial: "0", sm: "-2" }}
            className="-ml-[calc(theme(spacing.4))] w-[calc(100%_+_theme(spacing.8))] bg-background"
        >
            <Flex items="center" gap="4" p="2" className="rounded-b-lg border-t">
                <Skeleton size="8" rounded="full" className="overflow-hidden" />
                <Box w="full" cursor="text" py="1">
                    <Skeleton h="6" className="w-1/3" />
                </Box>
            </Flex>
        </Box>
    );
}

const mention = getMentionOnSelectItem();

const BoardCommentForm = memo((): JSX.Element => {
    const { projectUID, card, currentUser, replyRef } = useBoardCard();
    const [t] = useTranslation();
    const projectMembers = card.useForeignFieldArray("project_members");
    const bots = BotModel.Model.useModels(() => true);
    const mentionables = useMemo(() => [...projectMembers, ...bots], [projectMembers, bots]);
    const cards = ProjectCard.Model.useModels((model) => model.uid !== card.uid && model.project_uid === projectUID, [projectUID, card]);
    const valueRef = useRef<IEditorContent>({ content: "" });
    const setValue = useCallback((value: IEditorContent) => {
        valueRef.current = value;
    }, []);
    const drawerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<TEditor>(null);
    const editorName = `${card.uid}-comment-form`;
    const isCurrentEditor = useIsCurrentEditor(editorName);
    const [isValidating, setIsValidating] = useState(false);
    const { mutate: addCommentMutate } = useAddCardComment();
    const isClickedRef = useRef(false);
    const { stopEditing } = useToggleEditingByClickOutside("[data-card-comment-form]", (mode) => {
        if (mode === "view") {
            getEditorStore().setCurrentEditor(null);
        }
    });
    const onDrawerHandlePointerStart = useCallback(
        (type: "mouse" | "touch") => {
            if (isValidating) {
                return;
            }

            const upEvent = type === "mouse" ? "mouseup" : "touchend";

            const checkIsClick = () => {
                isClickedRef.current = true;
                window.removeEventListener(upEvent, checkIsClick);
            };

            window.addEventListener(upEvent, checkIsClick);

            setTimeout(() => {
                if (isClickedRef.current) {
                    getEditorStore().setCurrentEditor(null);
                    return;
                }

                window.removeEventListener(upEvent, checkIsClick);
            }, 250);
        },
        [isValidating, setIsValidating]
    );

    replyRef.current = (target: TUserLikeModel) => {
        if (isValidating) {
            return;
        }

        let username;
        if (isModel(target, "User")) {
            if (!target.isValidUser()) {
                return;
            }

            username = target.username;
        } else if (isModel(target, "BotModel")) {
            username = target.bot_uname;
        } else {
            return;
        }

        if (!isCurrentEditor || !editorRef.current) {
            getEditorStore().setCurrentEditor(editorName);
            setValue({
                content: `[**@${username}**](${target.uid}) `,
            });
            setTimeout(() => {
                editorRef.current?.tf.focus();
            }, 0);
            return;
        }

        mention(editorRef.current, {
            key: target.uid,
            text: username,
        });
    };

    const commentStorageKey = useMemo(() => `comment-${projectUID}-${card.uid}`, [projectUID, card.uid]);
    const saveDraftToStorage = useCallback(
        (content: string) => {
            if (typeof window === "undefined") {
                return;
            }
            const trimmed = content.trim();
            if (trimmed.length > 0) {
                window.sessionStorage.setItem(commentStorageKey, content);
            }
        },
        [commentStorageKey]
    );
    const readDraftFromStorage = useCallback((): string => {
        if (typeof window === "undefined") {
            return "";
        }
        return window.sessionStorage.getItem(commentStorageKey) ?? "";
    }, [commentStorageKey]);
    const clearDraftFromStorage = useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }
        window.sessionStorage.removeItem(commentStorageKey);
    }, [commentStorageKey]);

    useEffect(() => {
        if (!isCurrentEditor) {
            saveDraftToStorage(valueRef.current.content);
        }
    }, [isCurrentEditor, saveDraftToStorage]);

    const changeOpenState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            drawerRef.current?.setAttribute("data-state", "closed");
            setTimeout(() => {
                if (drawerRef.current) {
                    drawerRef.current.style.display = "none";
                }
                getEditorStore().setCurrentEditor(null);
            }, 450);
            return;
        } else {
            const currentContent = valueRef.current.content;
            const initialContent = currentContent.length > 0 ? currentContent : readDraftFromStorage();
            setValue({ content: initialContent });
        }

        getEditorStore().setCurrentEditor(editorName);
        setTimeout(() => {
            editorRef.current?.tf.focus();
        }, 0);
    };

    const saveComment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        addCommentMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                content: valueRef.current,
            },
            {
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                    setValue({ content: "" });
                    clearDraftFromStorage();
                    getEditorStore().setCurrentEditor(null);
                    setTimeout(() => {
                        changeOpenState(false);
                    }, 0);
                },
            }
        );
    };

    const clickOutside = (e: React.MouseEvent | CustomEvent) => {
        if (!isCurrentEditor) {
            return;
        }

        stopEditing(e);
    };

    return (
        <Form.Root className="sticky bottom-0 z-[100] -ml-[calc(theme(spacing.4))] w-[calc(100%_+_theme(spacing.8))] sm:-bottom-2">
            <Drawer.Root modal={false} handleOnly repositionInputs={false} open={isCurrentEditor} onOpenChange={changeOpenState}>
                <Drawer.Trigger asChild>
                    <Flex items="center" gap="4" p="2" className="rounded-b-lg border-t bg-background">
                        <UserAvatar.Root userOrBot={currentUser} avatarSize="sm" />
                        <Box w="full" cursor="text" py="1">
                            {t("card.Add a comment as {firstname} {lastname}", { firstname: currentUser.firstname, lastname: currentUser.lastname })}
                        </Box>
                    </Flex>
                </Drawer.Trigger>
                <Drawer.Content
                    withGrabber={false}
                    className="rounded-t-none border-none bg-transparent"
                    aria-describedby=""
                    focusGuards={false}
                    onPointerDownOutside={clickOutside}
                    onClick={clickOutside}
                    ref={drawerRef}
                >
                    <Drawer.Title hidden />
                    <Flex
                        direction="col"
                        position="relative"
                        mx="auto"
                        w="full"
                        pt="4"
                        border
                        className="max-w-[100vw] rounded-t-[10px] bg-background sm:max-w-screen-sm lg:max-w-screen-md"
                        data-card-comment-form
                    >
                        <Drawer.Handle
                            className="flex h-2 !w-full cursor-grab justify-center !bg-transparent py-3 text-center"
                            onMouseDown={() => onDrawerHandlePointerStart("mouse")}
                            onTouchStart={() => onDrawerHandlePointerStart("touch")}
                        >
                            <Box display="inline-block" h="2" rounded="full" className="w-[100px] bg-muted" />
                        </Drawer.Handle>
                        <Box position="relative" w="full" className="border-b">
                            <PlateEditor
                                value={valueRef.current}
                                currentUser={currentUser}
                                mentionables={mentionables}
                                linkables={cards}
                                className="h-full max-h-[min(50vh,200px)] min-h-[min(50vh,200px)] overflow-y-auto px-6 py-3"
                                editorType="card-new-comment"
                                form={{
                                    project_uid: projectUID,
                                    card_uid: card.uid,
                                }}
                                setValue={setValue}
                                editorRef={editorRef}
                            />
                        </Box>
                        <Flex items="center" gap="2" justify="start" p="1">
                            <Button variant="secondary" onClick={() => getEditorStore().setCurrentEditor(null)} disabled={isValidating}>
                                {t("common.Cancel")}
                            </Button>
                            <SubmitButton type="button" onClick={saveComment} isValidating={isValidating}>
                                {t("common.Save")}
                            </SubmitButton>
                        </Flex>
                    </Flex>
                </Drawer.Content>
            </Drawer.Root>
        </Form.Root>
    );
});

export default BoardCommentForm;
