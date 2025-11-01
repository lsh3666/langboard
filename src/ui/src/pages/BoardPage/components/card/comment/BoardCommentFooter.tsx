import { Button, Flex, Separator, SubmitButton, Toast } from "@/components/base";
import useDeleteCardComment from "@/controllers/api/card/comment/useDeleteCardComment";
import useUpdateCardComment from "@/controllers/api/card/comment/useUpdateCardComment";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel, Project } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { getEditorStore } from "@/core/stores/EditorStore";
import BoardCommentReaction from "@/pages/BoardPage/components/card/comment/BoardCommentReaction";
import { IBoardCommentContextParams } from "@/pages/BoardPage/components/card/comment/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCommentFooter(): JSX.Element {
    const { params } = ModelRegistry.ProjectCardComment.useContext<IBoardCommentContextParams>();
    const { isCurrentEditor } = params;

    return (
        <Flex items="center" gap="2">
            {isCurrentEditor ? <BoardCommentFooterEditButtons /> : <BoardCommentFooterActions />}
        </Flex>
    );
}

function BoardCommentFooterEditButtons() {
    const { projectUID, card } = useBoardCard();
    const [t] = useTranslation();
    const { model: comment, params } = ModelRegistry.ProjectCardComment.useContext<IBoardCommentContextParams>();
    const { valueRef } = params;
    const [isValidating, setIsValidating] = useState(false);
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const { mutate: updateCommentMutate } = useUpdateCardComment();

    const cancelEditing = () => {
        setValue(comment.content);
        getEditorStore().setCurrentEditor(null);
    };

    const saveComment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        if (!valueRef.current.content.trim().length) {
            Toast.Add.error(t("card.errors.Comment content cannot be empty."));
            setIsValidating(false);
            return;
        }

        if (comment.content.content.trim() === valueRef.current.content.trim()) {
            setIsValidating(false);
            return;
        }

        updateCommentMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                comment_uid: comment.uid,
                content: valueRef.current,
            },
            {
                onSuccess: () => {
                    comment.content = { ...valueRef.current };
                    Toast.Add.success(t("successes.Comment updated successfully."));
                    cancelEditing();
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                    cancelEditing();
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <>
            <Button variant="secondary" onClick={cancelEditing} disabled={isValidating}>
                {t("common.Cancel")}
            </Button>
            <SubmitButton type="button" onClick={saveComment} isValidating={isValidating}>
                {t("common.Save")}
            </SubmitButton>
        </>
    );
}

function BoardCommentFooterActions() {
    const { projectUID, card, currentUser, hasRoleAction, replyRef } = useBoardCard();
    const [t] = useTranslation();
    const { model: comment, params } = ModelRegistry.ProjectCardComment.useContext<IBoardCommentContextParams>();
    const { author, deletedComment, editorName, editorRef } = params;
    const projectMembers = card.useForeignFieldArray("project_members");
    const bots = BotModel.Model.useModels(() => true);
    const isAdmin = currentUser.useField("is_admin");
    const [isValidating, setIsValidating] = useState(false);
    const canEdit = currentUser.uid === author.uid || isAdmin;
    const { mutateAsync: deleteCommentMutateAsync } = useDeleteCardComment({ interceptToast: true });

    const deleteComment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = deleteCommentMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            comment_uid: comment.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                deletedComment(comment.uid);
                return t("successes.Comment deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <>
            <BoardCommentReaction comment={comment} />
            {hasRoleAction(Project.ERoleAction.Read) &&
                currentUser.uid !== author.uid &&
                currentUser.isValidUser() &&
                [...projectMembers, ...bots].find((user) => user.uid === author.uid) && (
                    <>
                        <Separator orientation="vertical" className="h-1/2" />
                        <Button
                            variant="link"
                            size="sm"
                            data-reply-component
                            className="h-5 p-0 text-accent-foreground/50"
                            onClick={() => replyRef.current?.(author)}
                        >
                            {t("card.Reply")}
                        </Button>
                    </>
                )}
            {canEdit && (
                <>
                    <Separator orientation="vertical" className="h-1/2" />
                    <Button
                        variant="link"
                        size="sm"
                        className="h-5 p-0 text-accent-foreground/50"
                        onClick={() => {
                            getEditorStore().setCurrentEditor(editorName);
                            setTimeout(() => {
                                editorRef.current?.tf.focus();
                            }, 50);
                        }}
                        disabled={isValidating}
                    >
                        {t("common.Edit")}
                    </Button>
                    <Separator orientation="vertical" className="h-1/2" />
                    <Button variant="link" size="sm" className="h-5 p-0 text-accent-foreground/50" onClick={deleteComment} disabled={isValidating}>
                        {t("common.Delete")}
                    </Button>
                </>
            )}
        </>
    );
}

export default BoardCommentFooter;
