import { Input, Toast } from "@/components/base";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useChangeProjectColumnName from "@/controllers/api/board/useChangeProjectColumnName";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, ProjectColumn } from "@/core/models";
import { useBoardController } from "@/core/providers/BoardController";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";

export interface IBoardColumnTitleProps {
    isDragging: bool;
    column: ProjectColumn.TModel;
}

const BoardColumnTitle = memo(({ isDragging, column }: IBoardColumnTitleProps) => {
    const { selectCardViewType } = useBoardController();
    const { project, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const columnName = column.useField("name");
    const editorName = `${column.uid}-column-title`;
    const isArchiveColumn = column.useField("is_archive");
    const { mutateAsync: changeProjectColumnNameMutateAsync } = useChangeProjectColumnName({ interceptToast: true });
    const canEdit = hasRoleAction(Project.ERoleAction.Update) && !isArchiveColumn;
    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => canEdit && !isDragging && !selectCardViewType,
        valueType: "input",
        disableNewLine: true,
        editorName,
        save: (value, endCallback) => {
            if (isArchiveColumn) {
                return;
            }

            setIsValidating(true);

            const promise = changeProjectColumnNameMutateAsync({
                project_uid: project.uid,
                project_column_uid: column.uid,
                name: value,
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
                    return t("successes.Column name changed successfully.");
                },
                finally: () => {
                    setIsValidating(false);
                    endCallback();
                },
            });
        },
        originalValue: columnName,
    });

    return (
        <BoardColumnTitleInput
            isEditing={isEditing}
            viewClassName={canEdit ? "cursor-text" : ""}
            canEdit={!isDragging && canEdit}
            changeMode={changeMode}
            columnName={columnName}
            disabled={isValidating}
            isArchive={isArchiveColumn}
            inputRef={valueRef}
        />
    );
});
BoardColumnTitle.displayName = "Board.ColumnTitle";

export interface IBoardColumnTitleInput {
    isEditing: bool;
    viewClassName?: string;
    canEdit: bool;
    changeMode: (mode: "edit" | "view") => void;
    columnName: string;
    isArchive?: bool;
    disabled?: bool;
    inputRef: React.Ref<HTMLInputElement>;
}

export const BoardColumnTitleInput = memo(
    ({ isEditing, viewClassName, canEdit, changeMode, columnName, isArchive, disabled, inputRef }: IBoardColumnTitleInput) => {
        const [t] = useTranslation();
        const handleStartEditing = useCallback(
            (e: React.MouseEvent) => {
                if (!canEdit) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                changeMode("edit");
            },
            [canEdit, changeMode]
        );
        const handleInputClick = useCallback((e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
        }, []);
        const handleInputBlur = useCallback(() => {
            changeMode("view");
        }, [changeMode]);
        const handleInputKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                if (e.key !== "Enter") {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();
                changeMode("view");
            },
            [changeMode]
        );

        return (
            <>
                {!isEditing || isArchive ? (
                    <span
                        {...{ [DISABLE_DRAGGING_ATTR]: "" }}
                        className={cn("h-7 truncate", isArchive && "text-secondary-foreground/70", viewClassName)}
                        onPointerDown={handleStartEditing}
                    >
                        {columnName}
                    </span>
                ) : (
                    <Input
                        ref={inputRef}
                        className={cn(
                            "h-7 rounded-none border-x-0 border-t-0 p-0 pb-1 text-base font-semibold",
                            "focus-visible:border-b-primary focus-visible:ring-0"
                        )}
                        placeholder={t("board.Enter a title")}
                        disabled={disabled}
                        defaultValue={columnName}
                        onClick={handleInputClick}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                    />
                )}
            </>
        );
    }
);
BoardColumnTitleInput.displayName = "Board.ColumnTitleInput";

export default BoardColumnTitle;
