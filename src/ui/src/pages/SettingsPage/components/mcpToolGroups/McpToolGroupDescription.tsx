import { Box, Flex, IconComponent, Input, Toast } from "@/components/base";
import useUpdateMcpToolGroup from "@/controllers/api/settings/mcpToolGroups/useUpdateMcpToolGroup";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EHttpStatus } from "@langboard/core/enums";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const McpToolGroupDescription = memo(() => {
    const [t] = useTranslation();
    const { model: toolGroup } = ModelRegistry.McpToolGroup.useContext();
    const navigate = usePageNavigateRef();
    const description = toolGroup.useField("description");
    const editorName = `${toolGroup.uid}-tool-group-description`;
    const { mutateAsync } = useUpdateMcpToolGroup(toolGroup, { interceptToast: true });

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "input",
        editorName,
        save: (value, endCallback) => {
            const promise = mutateAsync({
                description: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler(
                        {
                            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                            },
                        },
                        messageRef
                    );

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("successes.MCP tool group description changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: description,
    });

    return (
        <Box>
            {!isEditing ? (
                <Flex items="center" cursor="pointer" textSize="sm" weight="semibold" onClick={() => changeMode("edit")}>
                    <Box as="span" className="max-w-[calc(100%_-_theme(spacing.6))] truncate">
                        {description}
                    </Box>
                    <IconComponent icon="pencil" size="4" className="ml-2" />
                </Flex>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-5 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-sm font-semibold scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    defaultValue={description}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onBlur={() => changeMode("view")}
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

export default McpToolGroupDescription;
