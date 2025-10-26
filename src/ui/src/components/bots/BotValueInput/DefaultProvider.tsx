/* eslint-disable @typescript-eslint/no-explicit-any */
import { TSharedBotValueInputProps } from "@/components/bots/BotValueInput/types";
import { showableDefaultInputs } from "@/components/bots/BotValueInput/utils";
import { API_URL, IS_OLLAMA_RUNNING } from "@/constants";
import { Agent, EBotPlatform, EBotPlatformRunningType, TAgentFormInput, TAgentModelName } from "@langboard/core/ai";
import { Utils } from "@langboard/core/utils";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotValueDefaultInputContext {
    platform: EBotPlatform;
    platformRunningType: EBotPlatformRunningType;
    valuesRef: React.RefObject<Record<string, any>>;
    selectedProvider: TAgentModelName;
    setSelectedProvider: React.Dispatch<React.SetStateAction<TAgentModelName>>;
    selectedApis: string[];
    setSelectedApis: React.Dispatch<React.SetStateAction<string[]>>;
    inputs: TAgentFormInput[];
    setInputs: React.Dispatch<React.SetStateAction<TAgentFormInput[]>>;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    apiList: Record<string, string>;
    setApiList: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setValue: (name: string) => (value: any) => void;
    setInputRef: (name: string) => (element: HTMLElement | null) => void;
    required?: bool;
    isValidating: bool;
    showableInputs: ("api_names" | "provider" | "prompt")[];
}

interface IBotValueDefaultInputProviderProps extends TSharedBotValueInputProps {
    children: React.ReactNode;
}

const initialContext = {
    platform: EBotPlatform.Default,
    platformRunningType: EBotPlatformRunningType.Default,
    valuesRef: { current: {} },
    selectedProvider: "OpenAI" as TAgentModelName,
    setSelectedProvider: () => {},
    selectedApis: [] as string[],
    setSelectedApis: () => {},
    inputs: [] as TAgentFormInput[],
    setInputs: () => {},
    errors: {} as Record<string, string>,
    setErrors: () => {},
    apiList: {} as Record<string, string>,
    setApiList: () => {},
    setValue: () => () => {},
    setInputRef: () => () => {},
    required: false,
    isValidating: false,
    showableInputs: [],
};

const BotValueDefaultInputContext = createContext<IBotValueDefaultInputContext>(initialContext);

export const BotValueDefaultInputProvider = ({
    platform,
    platformRunningType,
    value,
    newValueRef,
    isValidating,
    required,
    ref,
    children,
}: IBotValueDefaultInputProviderProps): React.ReactNode => {
    const [t] = useTranslation();
    const valuesRef = useRef<Record<string, any>>(Utils.String.isJsonString(value) ? JSON.parse(value) : {});
    const [selectedProvider, setSelectedProvider] = useState<TAgentModelName>((valuesRef.current["agent_llm"] as TAgentModelName) ?? "OpenAI");
    const [selectedApis, setSelectedApis] = useState<string[]>((valuesRef.current["api_names"] as string[]) ?? []);
    const [inputs, setInputs] = useState<TAgentFormInput[]>([]);
    const inputsRef = useRef<Record<string, HTMLElement | null>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const setInputRef = (name: string) => (element: HTMLElement | null) => {
        inputsRef.current[name] = element;
    };
    const setValue = (name: string) => (value: any) => {
        valuesRef.current[name] = value;
        newValueRef.current = JSON.stringify(valuesRef.current);
    };
    const [apiList, setApiList] = useState<Record<string, string>>({});
    const showableInputs = useMemo(() => {
        return showableDefaultInputs[platform]?.[platformRunningType] ?? [];
    }, [platform, platformRunningType]);
    const getRef = () => ({
        type: "default-bot-json" as const,
        value: newValueRef.current,
        validate: (shouldFocus?: bool) => {
            if (!required) {
                return true;
            }

            let focusable: HTMLElement | null = null;
            const newErrors: Record<string, string> = {};

            if (showableInputs.includes("provider")) {
                if (!valuesRef.current["agent_llm"]) {
                    newErrors["agent_llm"] = t("bot.agent.errors.missing.agent_llm");
                    if (!focusable) {
                        focusable = inputsRef.current.agent_llm;
                    }
                }
            }

            inputs.forEach((input) => {
                const value = valuesRef.current[input.name];
                if (!value && !input.nullable) {
                    newErrors[input.name] = t(`bot.agent.errors.missing.${input.name}`);
                    if (!focusable) {
                        focusable = inputsRef.current[input.name];
                    }
                }
            });

            if (focusable) {
                setErrors(() => newErrors);
                if (shouldFocus) {
                    focusable?.focus();
                }
                return false;
            }

            return true;
        },
        onSuccess: () => {
            setErrors(() => ({}));
        },
    });

    if (Utils.Type.isFunction(ref)) {
        ref(getRef());
    } else if (ref) {
        ref.current = getRef();
    }

    useEffect(() => {
        for (let i = 0; i < inputs.length; ++i) {
            const input = inputs[i];

            if (input.type === "select") {
                delete valuesRef.current[input.name];
            }
        }

        if (showableInputs.includes("provider")) {
            setValue("agent_llm")(selectedProvider);
        } else {
            delete valuesRef.current["agent_llm"];
        }

        setInputs(
            Agent.getInputForm({
                platform,
                platformRunningType,
                model: selectedProvider,
                envs: { IS_OLLAMA_RUNNING, API_URL },
            })
        );
    }, [platform, platformRunningType, selectedProvider]);

    return (
        <BotValueDefaultInputContext.Provider
            value={{
                platform,
                platformRunningType,
                valuesRef,
                selectedProvider,
                setSelectedProvider,
                selectedApis,
                setSelectedApis,
                inputs,
                setInputs,
                errors,
                setErrors,
                apiList,
                setApiList,
                setValue,
                setInputRef,
                required,
                isValidating,
                showableInputs,
            }}
        >
            {children}
        </BotValueDefaultInputContext.Provider>
    );
};

export const useBotValueDefaultInput = () => {
    const context = useContext(BotValueDefaultInputContext);
    if (!context) {
        throw new Error("useBotValueDefaultInput must be used within an BotValueDefaultInputProvider");
    }
    return context;
};
