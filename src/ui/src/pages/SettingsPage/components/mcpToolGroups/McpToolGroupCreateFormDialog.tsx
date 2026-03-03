/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from "react-i18next";
import { Box, Button, Checkbox, Dialog, Floating, Form, Label, SubmitButton, Toast, Tooltip } from "@/components/base";
import FormErrorMessage from "@/components/FormErrorMessage";
import { useEffect, useRef, useState } from "react";
import useCreateMcpToolGroup from "@/controllers/api/settings/mcpToolGroups/useCreateMcpToolGroup";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EHttpStatus } from "@langboard/core/enums";
import { ROUTES } from "@/core/routing/constants";
import { Utils } from "@langboard/core/utils";
import { McpToolGroup } from "@/core/models";
import useGetMcpToolList from "@/controllers/api/mcp/getMcpToolList";
import { useMcpTools } from "@/core/stores/McpToolStore";
import MultiSelect from "@/components/MultiSelect";
import { ISharedSettingsModalProps } from "@/pages/SettingsPage/types";

export interface IMcpToolGroupCreateFormDialogProps extends ISharedSettingsModalProps {
    groupType: McpToolGroup.TGroupType;
}

function McpToolGroupCreateFormDialog({ opened, setOpened, groupType }: IMcpToolGroupCreateFormDialogProps) {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const [isValidating, setIsValidating] = useState(false);
    const tools = useMcpTools();
    const inputsRef = useRef({
        name: null as HTMLInputElement | null,
        description: null as HTMLInputElement | null,
        tools: null as HTMLInputElement | null,
    });
    const setInputRef = (key: keyof typeof inputsRef.current) => (el: HTMLElement | null) => {
        inputsRef.current[key] = el as any;
    };
    const [isActive, setIsActive] = useState(true);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const { mutateAsync: getMcpToolListMutateAsync } = useGetMcpToolList();
    const { mutate: createMcpToolGroupMutate } = useCreateMcpToolGroup();
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchMcpTools = async () => {
            try {
                await getMcpToolListMutateAsync({});
            } catch (error) {
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: {
                        after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                    },
                });

                handle(error);
            }
        };

        fetchMcpTools();
    }, []);

    const save = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const values = {} as Record<keyof typeof inputsRef.current, string>;
        const newErrors = {} as Record<keyof typeof inputsRef.current, string>;
        let focusableInput = null as HTMLInputElement | HTMLTextAreaElement | null;

        const shouldValidateInputs: (keyof typeof inputsRef.current)[] = ["name"];

        shouldValidateInputs.forEach((key) => {
            const input = inputsRef.current[key] as HTMLInputElement | HTMLTextAreaElement;
            if (!input) {
                return;
            }

            const value = input.value.trim();
            if (!value) {
                newErrors[key] = t(`settings.errors.missing.tool_group_${key}`);
                if (!focusableInput) {
                    focusableInput = input;
                }
            } else {
                values[key] = value;
            }
        });

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            setIsValidating(false);
            focusableInput?.focus();
            return;
        }

        createMcpToolGroupMutate(
            {
                name: values.name,
                description: values.description,
                tools: selectedTools,
                activate: isActive,
                is_global: groupType === "global",
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.MCP tool group created successfully."));
                    setOpened(false);
                    setSelectedTools([]);
                    setErrors({});
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

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        setOpened(opened);
        if (!opened) {
            setSelectedTools([]);
            setErrors({});
        }
    };

    return (
        <Dialog.Root open={opened} onOpenChange={changeOpenedState}>
            <Dialog.Content className="sm:max-w-md" aria-describedby="">
                <Dialog.Header>
                    <Dialog.Title>{t(`mcp.Create ${groupType === "global" ? "Global" : "Admin"} MCP Server`)}</Dialog.Title>
                </Dialog.Header>
                <Form.Root className="mt-4" onSubmit={(e) => e.preventDefault()}>
                    <Box mt="10">
                        <Floating.LabelInput
                            label={t("settings.Name")}
                            autoFocus
                            autoComplete="off"
                            required
                            disabled={isValidating}
                            ref={setInputRef("name")}
                        />
                        {errors.name && <FormErrorMessage error={errors.name} notInForm />}
                    </Box>
                    <Box mt="4">
                        <Floating.LabelInput
                            label={t("settings.Description")}
                            autoComplete="off"
                            disabled={isValidating}
                            ref={setInputRef("description")}
                        />
                        {errors.description && <FormErrorMessage error={errors.description} notInForm />}
                    </Box>
                    <Box mt="4">
                        <MultiSelect
                            placeholder={t("settings.Select tool(s) to use")}
                            selections={Object.keys(tools).map((value) => ({ label: value, value }))}
                            selectedValue={selectedTools}
                            listClassName="absolute w-[calc(100%_-_theme(spacing.6))]"
                            badgeListClassName="max-h-28 overflow-y-auto relative"
                            inputClassName="sticky bottom-0 bg-background ml-0 pl-2"
                            onValueChange={setSelectedTools}
                            createBadgeWrapper={(badge, value) => (
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
                                    <Tooltip.Content className="max-w-[min(95vw,theme(spacing.96))]">{tools[value]?.name}</Tooltip.Content>
                                </Tooltip.Root>
                            )}
                            disabled={isValidating}
                        />
                    </Box>
                    <Box mt="4">
                        <Label display="flex" items="center" gap="1.5" w="20" mb="2" cursor="pointer">
                            <Checkbox
                                onCheckedChange={(checked) => {
                                    if (Utils.Type.isString(checked)) {
                                        return;
                                    }
                                    setIsActive(checked);
                                }}
                                checked={isActive}
                                disabled={isValidating}
                            />
                            {t("settings.Active")}
                        </Label>
                    </Box>
                    <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                        <Dialog.Close asChild>
                            <Button type="button" variant="outline" disabled={isValidating}>
                                {t("common.Cancel")}
                            </Button>
                        </Dialog.Close>
                        <SubmitButton type="submit" isValidating={isValidating} onClick={save}>
                            {t("common.Create")}
                        </SubmitButton>
                    </Dialog.Footer>
                </Form.Root>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default McpToolGroupCreateFormDialog;
