import { useEffect } from "react";
import { AGENT_MODELS, TAgentModelName } from "@langboard/core/ai";
import { Box, Flex, Floating, IconComponent, Select, SubmitButton, Tooltip } from "@/components/base";
import { useTranslation } from "react-i18next";
import FormErrorMessage from "@/components/FormErrorMessage";
import { TSharedBotValueInputProps } from "@/components/bots/BotValueInput/types";
import useGetApiList from "@/controllers/api/settings/schemas/useGetApiList";
import MultiSelect from "@/components/MultiSelect";
import { BotValueDefaultInputProvider, useBotValueDefaultInput } from "@/components/bots/BotValueInput/DefaultProvider";
import DefaultTypedInput from "@/components/bots/BotValueInput/DefaultTypedInput";
import { providerIconMap } from "@/components/bots/BotValueInput/utils";

function BotValueDefaultInput(props: TSharedBotValueInputProps) {
    return (
        <BotValueDefaultInputProvider {...props}>
            <BotValueDefaultInputDisplay {...props} />
        </BotValueDefaultInputProvider>
    );
}

function BotValueDefaultInputDisplay({ isValidating, required, change }: TSharedBotValueInputProps) {
    const [t] = useTranslation();
    const { mutateAsync: getApiListMutateAsync } = useGetApiList({ interceptToast: true });
    const {
        valuesRef,
        setInputRef,
        selectedProvider,
        setSelectedProvider,
        setValue,
        inputs,
        errors,
        selectedApis,
        setSelectedApis,
        apiList,
        setApiList,
        showableInputs,
    } = useBotValueDefaultInput();

    useEffect(() => {
        setValue("api_names")(selectedApis);
    }, [selectedApis]);

    useEffect(() => {
        const getApiList = async () => {
            const data = await getApiListMutateAsync({});
            setApiList(data || {});
        };
        getApiList();
    }, []);

    return (
        <Box border rounded px="3" pt="5" pb="4" position="relative">
            <Box position="absolute" className="start-2 top-2.5 z-10 origin-[0] -translate-y-6 bg-background px-2">
                {t("bot.agent.Agent settings")}
            </Box>
            {showableInputs.includes("api_names") && (
                <Box>
                    <MultiSelect
                        placeholder={t("bot.agent.Select API(s) to use")}
                        selections={Object.keys(apiList).map((value) => ({ label: value, value }))}
                        selectedValue={selectedApis}
                        listClassName="absolute w-[calc(100%_-_theme(spacing.6))]"
                        badgeListClassName="max-h-28 overflow-y-auto relative"
                        inputClassName="sticky bottom-0 bg-background ml-0 pl-2"
                        onValueChange={setSelectedApis}
                        createBadgeWrapper={(badge, value) => (
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
                                <Tooltip.Content className="max-w-[min(95vw,theme(spacing.96))]">{apiList[value]}</Tooltip.Content>
                            </Tooltip.Root>
                        )}
                        disabled={isValidating}
                    />
                </Box>
            )}
            {showableInputs.includes("provider") && (
                <Box mt="4">
                    <Floating.LabelSelect
                        label={t("bot.agent.Select a provider")}
                        value={selectedProvider}
                        onValueChange={setSelectedProvider as (value: TAgentModelName) => void}
                        required={required}
                        disabled={isValidating}
                        options={AGENT_MODELS.map((option) => (
                            <Select.Item key={`default-bot-json-input-agent-${option}`} value={option}>
                                <Flex items="center" gap="2">
                                    <IconComponent icon={providerIconMap[option]} size="4" />
                                    {option}
                                </Flex>
                            </Select.Item>
                        ))}
                        ref={setInputRef("agent_llm")}
                    />
                    {errors.agent_llm && <FormErrorMessage error={errors.agent_llm} notInForm />}
                </Box>
            )}
            {showableInputs.includes("prompt") && (
                <Box mt="4">
                    <Floating.LabelTextarea
                        label={t("bot.agent.System prompt")}
                        defaultValue={valuesRef.current["system_prompt"] ?? ""}
                        resize="none"
                        className="h-36"
                        disabled={isValidating}
                        onInput={(e) => setValue("system_prompt")(e.currentTarget.value)}
                        ref={setInputRef("system_prompt")}
                    />
                </Box>
            )}
            {inputs.map((input) => (
                <Box mt="4" key={`default-bot-json-input-${selectedProvider}-${input.name}`}>
                    <DefaultTypedInput input={input} />
                    {errors[input.name] && <FormErrorMessage error={errors[input.name]} notInForm />}
                </Box>
            ))}

            {change && (
                <Box mt="4" className="text-center">
                    <SubmitButton type="button" size="sm" onClick={change} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Box>
            )}
        </Box>
    );
}

export default BotValueDefaultInput;
