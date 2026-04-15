import Input from "@/components/base/Input";
import Toast from "@/components/base/Toast";
import useChangeProjectColumnName from "@/controllers/api/board/useChangeProjectColumnName";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { ProjectColumn } from "@/core/models";
import { ProjectRole } from "@/core/models/roles";
import { useBoardController } from "@/core/providers/BoardController";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardColumnNameProps {
    isDragging: bool;
    column: ProjectColumn.TModel;
}

export interface IBoardColumnNameRef {
    startEditing: () => void;
}

const BoardColumnName = memo(
    forwardRef<IBoardColumnNameRef, IBoardColumnNameProps>(({ isDragging, column }: IBoardColumnNameProps, ref) => {
        const { selectCardViewType } = useBoardController();
        const { project, hasRoleAction } = useBoard();
        const [t] = useTranslation();
        const [isValidating, setIsValidating] = useState(false);
        const columnName = column.useField("name");
        const editorName = `${column.uid}-column-title`;
        const isArchiveColumn = column.useField("is_archive");
        const { mutateAsync: changeProjectColumnNameMutateAsync } = useChangeProjectColumnName({ interceptToast: true });
        const canEdit = hasRoleAction(ProjectRole.EAction.Update) && !isArchiveColumn;
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

        useImperativeHandle(
            ref,
            () => ({
                startEditing: () => {
                    changeMode("edit");
                },
            }),
            [changeMode]
        );

        useEffect(() => {
            if (!isEditing || !valueRef.current) {
                return;
            }

            requestAnimationFrame(() => {
                valueRef.current?.focus();
                valueRef.current?.select();
            });
        }, [isEditing, valueRef]);

        return (
            <BoardColumnNameInput
                isEditing={isEditing}
                viewClassName={!isDragging && canEdit ? "cursor-grab" : ""}
                columnName={columnName}
                disabled={isValidating}
                isArchive={isArchiveColumn}
                inputRef={valueRef}
                changeMode={changeMode}
            />
        );
    })
);
BoardColumnName.displayName = "Board.ColumnName";

export interface IBoardColumnNameInput {
    isEditing: bool;
    viewClassName?: string;
    columnName: string;
    isArchive?: bool;
    disabled?: bool;
    inputRef: React.Ref<HTMLInputElement>;
    changeMode: (mode: "edit" | "view") => void;
}

export const BoardColumnNameInput = memo(
    ({ isEditing, viewClassName, changeMode, columnName, isArchive, disabled, inputRef }: IBoardColumnNameInput) => {
        const [t] = useTranslation();
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
                    <span className={cn("h-7 truncate", isArchive && "text-secondary-foreground/70", viewClassName)}>{columnName}</span>
                ) : (
                    <Input
                        ref={inputRef}
                        className={cn(
                            "h-7 rounded-none border-x-0 border-t-0 p-0 pb-1 text-base font-semibold",
                            "focus-visible:border-b-primary focus-visible:ring-0"
                        )}
                        placeholder={t("board.Enter a name")}
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
BoardColumnNameInput.displayName = "Board.ColumnNameInput";

export default BoardColumnName;
