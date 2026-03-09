import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Input from "@/components/base/Input";
import Toast from "@/components/base/Toast";
import useUpdateMcpToolGroup from "@/controllers/api/settings/mcpToolGroups/useUpdateMcpToolGroup";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { McpRole } from "@/core/models/roles";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EHttpStatus } from "@langboard/core/enums";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const McpToolGroupName = memo(() => {
    const [t] = useTranslation();
    const { model: toolGroup } = ModelRegistry.McpToolGroup.useContext();
    const navigate = usePageNavigateRef();
    const { currentUser } = useAppSetting();
    const mcpRoleActions = currentUser.useField("mcp_role_actions");
    const { hasRoleAction } = useRoleActionFilter(mcpRoleActions);
    const canUpdateMcpToolGroup = hasRoleAction(McpRole.EAction.Update);
    const name = toolGroup.useField("name");
    const editorName = `${toolGroup.uid}-tool-group-name`;
    const { mutateAsync } = useUpdateMcpToolGroup(toolGroup, { interceptToast: true });

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => canUpdateMcpToolGroup,
        valueType: "input",
        editorName,
        save: (value, endCallback) => {
            const promise = mutateAsync({
                name: value,
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
                    return t("successes.MCP tool group name changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: name,
    });

    return (
        <Box>
            {!isEditing ? (
                <Flex
                    items="center"
                    cursor={canUpdateMcpToolGroup ? "pointer" : "default"}
                    textSize="lg"
                    weight="semibold"
                    onClick={() => changeMode("edit")}
                >
                    <Box as="span" className="max-w-[calc(100%_-_theme(spacing.6))] truncate">
                        {name}
                    </Box>
                    {canUpdateMcpToolGroup && <IconComponent icon="pencil" size="4" className="ml-2" />}
                </Flex>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-7 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-lg font-semibold scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    defaultValue={name}
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

export default McpToolGroupName;
