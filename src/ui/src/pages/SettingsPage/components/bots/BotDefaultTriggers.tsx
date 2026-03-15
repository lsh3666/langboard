import Box from "@/components/base/Box";
import Button from "@/components/base/Button";
import Flex from "@/components/base/Flex";
import Input from "@/components/base/Input";
import Select from "@/components/base/Select";
import Toast from "@/components/base/Toast";
import BotDefaultScopeTriggerConditions from "@/components/bots/BotDefaultScopeTriggerConditions";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { SettingRole } from "@/core/models/roles";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import useCreateBotDefaultScopeBranch from "@/controllers/api/settings/bots/useCreateBotDefaultScopeBranch";
import useDeleteBotDefaultScopeBranch from "@/controllers/api/settings/bots/useDeleteBotDefaultScopeBranch";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/core/routing/constants";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EHttpStatus } from "@langboard/core/enums";
import { BotDefaultScopeBranchModel } from "@/core/models";

const BotDefaultTriggers = memo(() => {
    const { model: bot } = ModelRegistry.BotModel.useContext();
    const { currentUser } = useAppSetting();
    const settingRoleActions = currentUser.useField("setting_role_actions");
    const { hasRoleAction } = useRoleActionFilter(settingRoleActions);
    const canUpdateBot = hasRoleAction(SettingRole.EAction.BotUpdate);

    return (
        <Flex justify="center" mt="3">
            <Flex direction="col" gap="4" w="full" className="max-w-screen-lg">
                <DefaultScopesTab botUID={bot.uid} canUpdate={canUpdateBot} />
            </Flex>
        </Flex>
    );
});

interface IDefaultScopesTabProps {
    botUID: string;
    canUpdate: boolean;
}

function DefaultScopesTab({ botUID, canUpdate }: IDefaultScopesTabProps) {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const [isCreating, setIsCreating] = useState(false);
    const [newScopeName, setNewScopeName] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [selectedBranchUID, setSelectedBranchUID] = useState<string>();
    const defaultScopes = BotDefaultScopeBranchModel.Model.useModels((model) => model.bot_uid === botUID);
    const { mutate: createDefaultScopeBranch } = useCreateBotDefaultScopeBranch();
    const { mutate: deleteDefaultScopeBranch } = useDeleteBotDefaultScopeBranch();
    const selectedBranch = useMemo(
        () => defaultScopes.find((branch) => branch.uid === selectedBranchUID) || null,
        [defaultScopes, selectedBranchUID]
    );

    const handleCreate = () => {
        if (!newScopeName.trim()) {
            return;
        }

        setIsValidating(true);

        createDefaultScopeBranch(
            {
                bot_uid: botUID,
                name: newScopeName,
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.Default scope branch created successfully."));
                    setIsCreating(false);
                    setNewScopeName("");
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
            }
        );
    };

    const handleDelete = (scope_uid: string) => {
        deleteDefaultScopeBranch(
            {
                default_scope_uid: scope_uid,
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.Default scope branch deleted successfully."));
                    if (selectedBranchUID === scope_uid) {
                        setSelectedBranchUID(() => undefined);
                    }
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    });

                    handle(error);
                },
            }
        );
    };

    return (
        <Flex direction="col" gap="4">
            <Flex justify="between" items="center">
                <Box textSize="lg" weight="semibold">
                    {t("settings.Default Scopes")}
                </Box>
                <Button type="button" size="sm" onClick={() => setIsCreating(true)} disabled={!canUpdate || isCreating}>
                    {t("common.Create")}
                </Button>
            </Flex>

            {defaultScopes.length > 0 && (
                <Flex direction="col" gap="2">
                    <Box textSize="sm" weight="medium">
                        {t("settings.Select Branch")}
                    </Box>
                    <Select.Root value={selectedBranchUID} onValueChange={setSelectedBranchUID}>
                        <Select.Trigger className="w-full">
                            <Select.Value placeholder={t("settings.Select a branch to configure")} />
                        </Select.Trigger>
                        <Select.Content>
                            {defaultScopes.map((branch) => (
                                <Select.Item key={branch.uid} value={branch.uid}>
                                    {branch.name}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>
                </Flex>
            )}

            {isCreating && (
                <Flex direction="col" gap="2" p="4" border rounded>
                    <Input
                        placeholder={t("settings.Default scope name")}
                        value={newScopeName}
                        onChange={(e) => setNewScopeName(e.target.value)}
                        disabled={!canUpdate || isValidating}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCreate();
                            }
                        }}
                    />
                    <Flex gap="2">
                        <Button type="button" size="sm" onClick={handleCreate} disabled={!canUpdate || !newScopeName.trim() || isValidating}>
                            {t("common.Save")}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                setIsCreating(false);
                                setNewScopeName("");
                            }}
                            disabled={isValidating}
                        >
                            {t("common.Cancel")}
                        </Button>
                    </Flex>
                </Flex>
            )}

            {selectedBranch && (
                <Flex direction="col" gap="3" p="4" border rounded>
                    <Flex justify="between" items="center">
                        <Box weight="medium">{selectedBranch.name}</Box>
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(selectedBranch.uid)} disabled={!canUpdate}>
                            {t("common.Delete")}
                        </Button>
                    </Flex>
                    <BotDefaultScopeTriggerConditions branch={selectedBranch} key={selectedBranch.uid} />
                </Flex>
            )}
        </Flex>
    );
}

export default BotDefaultTriggers;
