import { Box, Textarea, Toast } from "@/components/base";
import useChangeWikiDetails from "@/controllers/api/wiki/useChangeWikiDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EHttpStatus } from "@langboard/core/enums";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiTitleProps {
    wiki: ProjectWiki.TModel;
}

const WikiTitle = memo(({ wiki }: IWikiTitleProps) => {
    const navigate = usePageNavigateRef();
    const { project } = useBoardWiki();
    const [t] = useTranslation();
    const { mutateAsync: changeWikiDetailsMutateAsync } = useChangeWikiDetails("title", { interceptToast: true });
    const title = wiki.useField("title");
    const forbidden = wiki.useField("forbidden");
    const editorName = `${wiki.uid}-wiki-title`;
    const { valueRef, height, isEditing, updateHeight, changeMode } = useChangeEditMode({
        canEdit: () => !forbidden,
        valueType: "textarea",
        disableNewLine: true,
        editorName,
        save: (value, endCallback) => {
            const promise = changeWikiDetailsMutateAsync({
                project_uid: project.uid,
                wiki_uid: wiki.uid,
                title: value,
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
                    return t("successes.Title changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: title,
    });

    return (
        <Box p="2">
            {!isEditing ? (
                <h1 className="min-h-8 cursor-text break-all border-b border-border text-xl md:text-2xl" onClick={() => changeMode("edit")}>
                    {title}
                </h1>
            ) : (
                <Textarea
                    ref={valueRef}
                    className={cn(
                        "min-h-8 break-all rounded-none border-x-0 border-t-0 p-0 pb-px text-xl md:text-2xl",
                        "scrollbar-hide focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    resize="none"
                    style={{ height }}
                    defaultValue={title}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onBlur={() => changeMode("view")}
                    onChange={updateHeight}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            changeMode("view");
                            return;
                        }
                    }}
                />
            )}
        </Box>
    );
});

export default WikiTitle;
