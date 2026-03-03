import { Button, Flex, Toast, Tooltip } from "@/components/base";
import useActivateMcpToolGroup from "@/controllers/api/settings/mcpToolGroups/useActivateMcpToolGroup";
import useDeactivateMcpToolGroup from "@/controllers/api/settings/mcpToolGroups/useDeactivateMcpToolGroup";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { McpToolGroup } from "@/core/models";
import { McpRole } from "@/core/models/roles";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IMcpToolGroupActivationProps {
    toolGroup: McpToolGroup.TModel;
    variant?: "default" | "list";
}

const McpToolGroupActivation = memo(({ toolGroup, variant = "default" }: IMcpToolGroupActivationProps) => {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { currentUser } = useAppSetting();
    const mcpRoleActions = currentUser.useField("mcp_role_actions");
    const { hasRoleAction } = useRoleActionFilter(mcpRoleActions);
    const canUpdateMcpToolGroup = hasRoleAction(McpRole.EAction.Update);
    const rawActivatedAt = toolGroup.useField("activated_at");
    const { mutate: activateMutate } = useActivateMcpToolGroup(toolGroup);
    const { mutate: deactivateMutate } = useDeactivateMcpToolGroup(toolGroup);
    const [isValidating, setIsValidating] = useState(false);

    const toggle = () => {
        if (isValidating || !canUpdateMcpToolGroup) {
            return;
        }

        setIsValidating(true);

        const activate = !rawActivatedAt;
        const mutate = activate ? activateMutate : deactivateMutate;

        mutate(toolGroup.uid, {
            onSuccess: () => {
                Toast.Add.success(t(`successes.MCP tool group ${activate ? "activated" : "deactivated"} successfully.`));
            },
            onError: (error) => {
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: {
                        after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                    },
                });

                handle(error);
            },
            onSettled: () => {
                setIsValidating(false);
            },
        });
    };

    if (variant === "list") {
        return (
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <Flex justify="center">
                        <Button
                            variant={rawActivatedAt ? "default" : "secondary"}
                            size="sm"
                            className="cursor-pointer gap-1"
                            onClick={toggle}
                            disabled={!canUpdateMcpToolGroup}
                        >
                            {rawActivatedAt ? "● " : "○ "}
                            {rawActivatedAt ? t("settings.Active") : t("settings.Inactive")}
                        </Button>
                    </Flex>
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom" align="center">
                    {rawActivatedAt ? t("settings.Deactivate") : t("settings.Activate")}
                </Tooltip.Content>
            </Tooltip.Root>
        );
    }

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <Button
                    variant={rawActivatedAt ? "default" : "secondary"}
                    size="sm"
                    className="cursor-pointer gap-1"
                    onClick={toggle}
                    disabled={!canUpdateMcpToolGroup}
                >
                    {rawActivatedAt ? "● " : "○ "}
                    {rawActivatedAt ? t("settings.Active") : t("settings.Inactive")}
                </Button>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom" align="center">
                {rawActivatedAt ? t("settings.Deactivate") : t("settings.Activate")}
            </Tooltip.Content>
        </Tooltip.Root>
    );
});

export default McpToolGroupActivation;
