import { Button, Checkbox, Flex, Toast, Tooltip, Box, Popover } from "@/components/base";
import IconComponent from "@/components/base/IconComponent";
import useUpdateUserInSettings from "@/controllers/api/settings/users/useUpdateUserInSettings";
import useUpdateUserSettingRole from "@/controllers/api/settings/users/useUpdateUserSettingRole";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { User } from "@/core/models";
import { SettingRole } from "@/core/models/roles";
import { ROLE_ALL_GRANTED } from "@/core/models/roles/base";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { Utils } from "@langboard/core/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function UserSettingRole({ user, fullAccessEmails }: { user: User.TModel; fullAccessEmails: string[] }) {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { currentUser } = useAppSetting();
    const settingRoleActions = currentUser.useField("setting_role_actions");
    const { hasRoleAction } = useRoleActionFilter(settingRoleActions);
    const canUpdateUser = hasRoleAction(SettingRole.EAction.UserUpdate);
    const { mutateAsync: updateUser } = useUpdateUserInSettings(user, { interceptToast: true });
    const { mutateAsync: updateRole } = useUpdateUserSettingRole(user, { interceptToast: true });
    const [isValidating, setIsValidating] = useState(false);
    const isAdmin = user.useField("is_admin");
    const settingRoles = user.useField("setting_role_actions");

    const toggleAdmin = () => {
        if (isValidating) {
            return;
        }
        setIsValidating(true);

        const promise = updateUser({ is_admin: !isAdmin });

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
                return t("successes.User admin status changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const getCategoryInfo = (action: SettingRole.TActions) => {
        action = Utils.String.convertSafeEnum(SettingRole.EAction, action);
        for (const [category, actions] of Object.entries(SettingRole.CATEGORIZED_MAP)) {
            if (actions.includes(action)) {
                const readAction = actions.find((action) => action.endsWith("_read"));
                const dependentActions = readAction ? actions.filter((action) => action !== readAction) : [];
                return { category, readAction, dependentActions, allActions: actions };
            }
        }
        return null;
    };

    const toggleAction = (action: SettingRole.TActions) => {
        if (isValidating) {
            return;
        }
        setIsValidating(true);

        const hasAllGranted = settingRoles && settingRoles.includes(ROLE_ALL_GRANTED);
        const isSelected = settingRoles && (settingRoles.includes(action) || settingRoles.includes(ROLE_ALL_GRANTED));
        const categoryInfo = getCategoryInfo(action);
        let newActions: SettingRole.TActions[];

        action = Utils.String.convertSafeEnum(SettingRole.EAction, action);
        if (isSelected) {
            if (hasAllGranted) {
                newActions = Object.values(SettingRole.EAction).filter((currentAction) => currentAction !== action);
                if (categoryInfo && categoryInfo.readAction && action === categoryInfo.readAction) {
                    const categoryActionSet = new Set(categoryInfo.allActions);
                    newActions = newActions.filter(
                        (currentAction) => !categoryActionSet.has(Utils.String.convertSafeEnum(SettingRole.EAction, currentAction))
                    );
                }
            } else {
                newActions = settingRoles.filter((currentAction) => currentAction !== action);
                if (categoryInfo && categoryInfo.readAction && action === categoryInfo.readAction) {
                    const categoryActionSet = new Set(categoryInfo.allActions);
                    newActions = newActions.filter(
                        (currentAction) => !categoryActionSet.has(Utils.String.convertSafeEnum(SettingRole.EAction, currentAction))
                    );
                }
            }
        } else if (settingRoles) {
            if (categoryInfo && categoryInfo.readAction && categoryInfo.dependentActions.includes(action)) {
                newActions = [...new Set([...settingRoles, action, categoryInfo.readAction])];
            } else {
                newActions = [...settingRoles, action];
            }
        } else {
            if (categoryInfo && categoryInfo.readAction && categoryInfo.dependentActions.includes(action)) {
                newActions = [action, categoryInfo.readAction];
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
                return t("successes.User setting roles updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const isAllGranted = () => {
        return settingRoles && settingRoles.includes(ROLE_ALL_GRANTED);
    };

    const toggleAll = () => {
        if (isValidating) {
            return;
        }
        setIsValidating(true);

        const promise = updateRole({ actions: isAllGranted() ? [] : Object.values(SettingRole.EAction) });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);
                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.User setting roles updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const isCategoryFullyGranted = (categoryActions: SettingRole.TActions[]) => {
        return categoryActions.every((action) => settingRoles && (settingRoles.includes(action) || settingRoles.includes(ROLE_ALL_GRANTED)));
    };

    const toggleCategory = (categoryActions: SettingRole.TActions[]) => {
        if (isValidating) {
            return;
        }
        setIsValidating(true);

        const currentActions = settingRoles || [];
        const hasAllGranted = currentActions.includes(ROLE_ALL_GRANTED);
        const isFullyGranted = isCategoryFullyGranted(categoryActions);
        let newActions: SettingRole.TActions[];

        if (isFullyGranted) {
            if (hasAllGranted) {
                const categoryActionSet = new Set(categoryActions);
                newActions = Object.values(SettingRole.EAction).filter((currentAction) => !categoryActionSet.has(currentAction));
            } else {
                const categoryActionSet = new Set(categoryActions);
                newActions = currentActions.filter((currentAction) => !categoryActionSet.has(currentAction));
            }
        } else {
            newActions = [...new Set([...currentActions, ...categoryActions])];
        }

        const promise = updateRole({ actions: newActions });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);
                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.User setting roles updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const ACTION_TYPE_MAP = {
        read: Object.values(SettingRole.EAction).filter((action) => action.endsWith("_read")),
        create: Object.values(SettingRole.EAction).filter((action) => action.endsWith("_create")),
        update: Object.values(SettingRole.EAction).filter((action) => action.endsWith("_update")),
        delete: Object.values(SettingRole.EAction).filter((action) => action.endsWith("_delete")),
    };

    const isActionTypeFullyGranted = (actions: SettingRole.TActions[]) => {
        return actions.every((action) => settingRoles && (settingRoles.includes(action) || settingRoles.includes(ROLE_ALL_GRANTED)));
    };

    const toggleActionType = (actions: SettingRole.TActions[], type: "read" | "create" | "update" | "delete") => {
        if (isValidating) {
            return;
        }
        setIsValidating(true);

        const currentActions = settingRoles || [];
        const hasAllGranted = currentActions.includes(ROLE_ALL_GRANTED);
        const isFullyGranted = isActionTypeFullyGranted(actions);
        let newActions: SettingRole.TActions[];

        if (isFullyGranted) {
            if (hasAllGranted) {
                const actionSet = new Set(actions);
                newActions = Object.values(SettingRole.EAction).filter((currentAction) => !actionSet.has(currentAction));
            } else {
                const actionSet = new Set(actions);
                newActions = currentActions.filter((currentAction) => !actionSet.has(currentAction));
            }
            if (type === "read") {
                const allDependentActions = [...ACTION_TYPE_MAP.create, ...ACTION_TYPE_MAP.update, ...ACTION_TYPE_MAP.delete];
                const dependentSet = new Set(allDependentActions);
                newActions = newActions.filter(
                    (currentAction) => !dependentSet.has(Utils.String.convertSafeEnum(SettingRole.EAction, currentAction))
                );
            }
        } else {
            newActions = [...new Set([...currentActions, ...actions])];
            if (type !== "read") {
                newActions = [...new Set([...newActions, ...ACTION_TYPE_MAP.read])];
            }
        }

        const promise = updateRole({ actions: newActions });

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
        if (!isAdmin) {
            return t("settings.Enable admin first");
        }
        if (settingRoles && settingRoles.includes(ROLE_ALL_GRANTED)) {
            return t("settings.Full Admin");
        }
        if (settingRoles && settingRoles.length > 0) {
            return t("settings.Partial Admin ({{count}} permissions)", { count: settingRoles.length });
        }
        return t("settings.No Admin permissions");
    };

    if (fullAccessEmails.includes(user.email)) {
        return (
            <Flex justify="center" w="full">
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                        <IconComponent icon="shield-check" size="5" />
                    </Tooltip.Trigger>
                    <Tooltip.Content side="bottom" align="center">
                        {t("settings.Full access")}
                    </Tooltip.Content>
                </Tooltip.Root>
            </Flex>
        );
    }

    return (
        <Flex justify="center" items="center" w="full" gap="1">
            <Checkbox checked={!!isAdmin} onClick={toggleAdmin} disabled={isValidating || !canUpdateUser} />
            {isAdmin && (
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            title={getTooltipText()}
                            titleAlign="center"
                            titleSide="bottom"
                            disabled={!canUpdateUser}
                        >
                            <IconComponent icon="settings" size="4" />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content className="w-96" align="start" side="left">
                        <Box p="2">
                            <Flex justify="between" items="center" mb="3">
                                <Box weight="bold">{t("settings.Admin permissions")}</Box>
                                <Checkbox
                                    checked={!!isAllGranted()}
                                    onClick={toggleAll}
                                    disabled={isValidating || !canUpdateUser}
                                    label={<Box textSize="xs">{t("settings.Toggle all")}</Box>}
                                />
                            </Flex>

                            <Box mb="3">
                                <Flex items="center" justify="between" mb="2.5">
                                    <Box textSize="sm" weight="semibold" className="text-gray-500">
                                        {t("settings.All")}
                                    </Box>
                                </Flex>
                                <Flex wrap gap="3">
                                    {Object.entries(ACTION_TYPE_MAP).map(([type, actions]) => (
                                        <Checkbox
                                            key={type}
                                            checked={isActionTypeFullyGranted(actions)}
                                            onClick={() => toggleActionType(actions, type as "read" | "create" | "update" | "delete")}
                                            disabled={isValidating || !canUpdateUser}
                                            label={t(`role.action_types.${type}`)}
                                        />
                                    ))}
                                </Flex>
                            </Box>

                            <Box>
                                {Object.entries(SettingRole.CATEGORIZED_MAP).map(([category, categoryActions]) => (
                                    <Box key={category} mb="3">
                                        <Flex items="center" justify="between" mb="2.5">
                                            <Box textSize="sm" weight="semibold" className="text-gray-500">
                                                {t(`role.setting_categories.${new Utils.String.Case(category).toSnake()}`)}
                                            </Box>
                                            <Checkbox
                                                checked={isCategoryFullyGranted(categoryActions)}
                                                onClick={() => toggleCategory(categoryActions)}
                                                disabled={isValidating || !canUpdateUser}
                                                label={<Box textSize="xs">{t("settings.Toggle all")}</Box>}
                                            />
                                        </Flex>
                                        <Flex wrap gap="3">
                                            {categoryActions.map((action) => {
                                                const isSelected =
                                                    settingRoles && (settingRoles.includes(action) || settingRoles.includes(ROLE_ALL_GRANTED));
                                                return (
                                                    <Checkbox
                                                        key={action}
                                                        checked={isSelected}
                                                        onClick={() => toggleAction(action)}
                                                        disabled={isValidating || !canUpdateUser}
                                                        label={t(`role.setting.${action}`)}
                                                    />
                                                );
                                            })}
                                        </Flex>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Popover.Content>
                </Popover.Root>
            )}
        </Flex>
    );
}

export default UserSettingRole;
