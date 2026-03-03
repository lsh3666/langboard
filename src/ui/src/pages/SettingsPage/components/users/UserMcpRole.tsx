import { Button, Checkbox, Flex, Toast, Box, Popover, Tooltip } from "@/components/base";
import IconComponent from "@/components/base/IconComponent";
import useUpdateUserMcpRole from "@/controllers/api/settings/users/useUpdateUserMcpRole";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { User } from "@/core/models";
import { McpRole, SettingRole } from "@/core/models/roles";
import { ROLE_ALL_GRANTED } from "@/core/models/roles/base";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { Utils } from "@langboard/core/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function UserMcpRole({ user }: { user: User.TModel }) {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { currentUser } = useAppSetting();
    const settingRoleActions = currentUser.useField("setting_role_actions");
    const { hasRoleAction } = useRoleActionFilter(settingRoleActions);
    const canUpdateUser = hasRoleAction(SettingRole.EAction.UserUpdate);
    const { mutateAsync: updateRole } = useUpdateUserMcpRole(user, { interceptToast: true });
    const [isValidating, setIsValidating] = useState(false);
    const mcpRoles = user.useField("mcp_role_actions");
    const isAdmin = user.useField("is_admin");

    const READ_ACTION = McpRole.EAction.Read;
    const DEPENDENT_ACTIONS = [McpRole.EAction.Create, McpRole.EAction.Update, McpRole.EAction.Delete];

    const isAllGranted = () => {
        if (isAdmin) return true;
        return mcpRoles && mcpRoles.includes(ROLE_ALL_GRANTED);
    };

    const isActionSelected = (action: McpRole.TActions) => {
        if (isAdmin) return true;
        return mcpRoles && (mcpRoles.includes(action) || mcpRoles.includes(ROLE_ALL_GRANTED));
    };

    const toggleAction = (action: McpRole.TActions) => {
        if (isValidating || isAdmin || !canUpdateUser) return;
        setIsValidating(true);

        const hasAllGranted = mcpRoles && mcpRoles.includes(ROLE_ALL_GRANTED);
        const isSelected = mcpRoles && (mcpRoles.includes(action) || mcpRoles.includes(ROLE_ALL_GRANTED));
        let newActions: McpRole.TActions[];

        action = Utils.String.convertSafeEnum(McpRole.EAction, action);
        if (isSelected) {
            if (hasAllGranted) {
                newActions = Object.values(McpRole.EAction).filter((currentAction) => currentAction !== action);
                if (action === READ_ACTION) {
                    newActions = [];
                }
            } else {
                newActions = mcpRoles.filter((currentAction) => currentAction !== action);
                if (action === READ_ACTION) {
                    newActions = [];
                }
            }
        } else if (mcpRoles) {
            if (DEPENDENT_ACTIONS.includes(action)) {
                newActions = [...new Set([...mcpRoles, action, READ_ACTION])];
            } else {
                newActions = [...mcpRoles, action];
            }
        } else {
            if (DEPENDENT_ACTIONS.includes(action)) {
                newActions = [action, READ_ACTION];
            } else {
                newActions = [action];
            }
        }

        const promise = updateRole({ actions: newActions });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => {
                                navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                            },
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Role updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const toggleAll = () => {
        if (isValidating || isAdmin || !canUpdateUser) return;
        setIsValidating(true);

        const promise = updateRole({ actions: isAllGranted() ? [] : Object.values(McpRole.EAction) });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);
                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Role updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const getTooltipText = () => {
        if (isAdmin) return t("settings.Full access");
        if (mcpRoles && mcpRoles.includes(ROLE_ALL_GRANTED)) {
            return t("settings.Full access");
        }
        if (mcpRoles && mcpRoles.length > 0) {
            return t("settings.Partial access ({{count}} permissions)", { count: mcpRoles.length });
        }
        return t("settings.No Permissions");
    };

    const allActions = Object.values(McpRole.EAction);

    if (isAdmin) {
        return (
            <Flex justify="center" items="center" w="full">
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                        <IconComponent icon="wrench" size="4" className="text-gray-400" />
                    </Tooltip.Trigger>
                    <Tooltip.Content side="bottom" align="center">
                        {t("settings.Full access")}
                    </Tooltip.Content>
                </Tooltip.Root>
            </Flex>
        );
    }

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button variant="ghost" size="icon-sm" title={getTooltipText()} titleAlign="center" titleSide="bottom" disabled={!canUpdateUser}>
                    <IconComponent icon="wrench" size="4" />
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-96" align="start" side="left">
                <Box p="2">
                    <Flex justify="between" items="center" mb="3">
                        <Box weight="bold">{t("settings.MCP permissions")}</Box>
                        <Checkbox
                            checked={!!isAllGranted()}
                            onClick={toggleAll}
                            disabled={isValidating || isAdmin || !canUpdateUser}
                            label={<Box textSize="xs">{t("settings.Toggle all")}</Box>}
                        />
                    </Flex>

                    <Box>
                        <Flex wrap gap="3">
                            {allActions.map((action) => (
                                <Checkbox
                                    key={action}
                                    checked={isActionSelected(action)}
                                    onClick={() => toggleAction(action)}
                                    disabled={isValidating || isAdmin || !canUpdateUser}
                                    label={t(`role.mcp.${action}`)}
                                />
                            ))}
                        </Flex>
                    </Box>
                </Box>
            </Popover.Content>
        </Popover.Root>
    );
}

export default UserMcpRole;
