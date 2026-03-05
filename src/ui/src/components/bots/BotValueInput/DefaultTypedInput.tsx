import { Button, Checkbox, Flex, Floating, IconComponent, Label, Select } from "@/components/base";
import { useBotValueDefaultInput } from "@/components/bots/BotValueInput/DefaultProvider";
import { API_URL } from "@/constants";
import { api } from "@/core/helpers/Api";
import { TAgentFormInput, IStringAgentFormInput, ISelectAgentFormInput, IIntegerAgentFormInput } from "@langboard/core/ai";
import { Utils } from "@langboard/core/utils";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IDefaultTypedInputProps {
    input: TAgentFormInput;
    disabled?: bool;
}

function DefaultTypedInput({ input, disabled }: IDefaultTypedInputProps) {
    const { selectedProvider, valuesRef, setValue } = useBotValueDefaultInput();
    switch (input.type) {
        case "text":
        case "password":
            setValue(input.name)(valuesRef.current[input.name] || input.defaultValue);
            return <DefaultStringInput key={`default-bot-json-input-${selectedProvider}-${input.name}`} input={input} disabled={disabled} />;
        case "select":
            setValue(input.name)(valuesRef.current[input.name] || input.defaultValue || input.options[0]);
            return <DefaultSelectInput key={`default-bot-json-input-${selectedProvider}-${input.name}`} input={input} disabled={disabled} />;
        case "integer":
            setValue(input.name)(valuesRef.current[input.name] || input.defaultValue || input.min);
            return <DefaultIntegerInput key={`default-bot-json-input-${selectedProvider}-${input.name}`} input={input} disabled={disabled} />;
    }
}

function DefaultStringInput({ input, disabled }: { input: IStringAgentFormInput; disabled?: bool }) {
    const [t] = useTranslation();
    const { valuesRef, setInputRef, setValue, isValidating, required } = useBotValueDefaultInput();
    const [isDefault, setIsDefault] = useState(!!input.checkDefault && valuesRef.current[input.name] === input.checkDefault);

    const inputComp = (
        <Floating.LabelInput
            type={input.type}
            name={input.name}
            label={input.label}
            autoComplete="off"
            defaultValue={valuesRef.current[input.name] ?? input.defaultValue}
            onInput={(e) => setValue(input.name)(e.currentTarget.value)}
            required={required && !input.nullable}
            disabled={isValidating || isDefault || disabled}
            ref={setInputRef(input.name)}
        />
    );

    if (!Utils.Type.isString(input.checkDefault)) {
        return inputComp;
    }

    return (
        <Flex items="center" justify="between" gap="2">
            {inputComp}
            <Label display="flex" items="center" gap="1.5" w="36" cursor="pointer">
                <Checkbox
                    checked={isDefault}
                    onCheckedChange={(checked) => {
                        if (Utils.Type.isString(checked)) {
                            return;
                        }

                        setIsDefault(checked);
                        setValue(input.name)(checked ? input.checkDefault : "");
                    }}
                />
                {t("common.Use default")}
            </Label>
        </Flex>
    );
}

function DefaultSelectInput({ input, disabled }: { input: ISelectAgentFormInput; disabled?: bool }) {
    const [t] = useTranslation();
    const { selectedProvider, valuesRef, setInputRef, setValue, isValidating, required } = useBotValueDefaultInput();
    const [currentValue, setCurrentValue] = useState(valuesRef.current[input.name] || input.defaultValue || input.options[0]);
    const [options, setOptions] = useState<string[]>(input.options);
    const fetchOptions = useCallback(async () => {
        if (!input.getOptions) {
            return;
        }

        const newOptions = await input.getOptions({ values: valuesRef.current, envs: { API_URL }, api });
        setOptions(() => newOptions);
        input.options = newOptions;
        if (!newOptions.includes(currentValue)) {
            setCurrentValue(() => newOptions[0]);
            setValue(input.name)(newOptions[0]);
        }
    }, [input, input.getOptions, selectedProvider, currentValue, setOptions]);

    useEffect(() => {
        if (!input.options.length) {
            fetchOptions();
        } else {
            setOptions(input.options);
        }
        setValue(input.name)(currentValue);
    }, [currentValue]);

    useEffect(() => {
        if (!input.options.length) {
            fetchOptions();
        } else {
            setOptions(input.options);
        }
        const newValue = valuesRef.current[input.name] || input.defaultValue || input.options[0];
        setValue(input.name)(newValue);
        setCurrentValue(newValue);
    }, [selectedProvider, input.defaultValue, input.name, setValue, valuesRef]);

    const inputComp = (
        <Floating.LabelSelect
            label={input.label}
            value={currentValue}
            onValueChange={setCurrentValue}
            required={required && !input.nullable}
            disabled={isValidating || disabled}
            options={options.map((option) => (
                <Select.Item value={option} key={`default-bot-json-input-${selectedProvider}-${input.name}-${option}`}>
                    {option}
                </Select.Item>
            ))}
            ref={setInputRef(input.name)}
        />
    );

    if (!input.getOptions) {
        return inputComp;
    }

    return (
        <Flex items="center" justify="between" gap="2">
            {inputComp}
            <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-10"
                disabled={isValidating || disabled}
                onClick={fetchOptions}
                title={t("common.Refresh")}
            >
                <IconComponent icon="rotate-ccw" size="4" />
            </Button>
        </Flex>
    );
}

function DefaultIntegerInput({ input, disabled }: { input: IIntegerAgentFormInput; disabled?: bool }) {
    const { valuesRef, setValue, required, isValidating, setInputRef } = useBotValueDefaultInput();

    return (
        <Floating.LabelInput
            type="number"
            name={input.name}
            label={input.label}
            autoComplete="off"
            defaultValue={valuesRef.current[input.name] || input.defaultValue || input.min}
            onInput={(e) => setValue(input.name)(e.currentTarget.value)}
            required={required && !input.nullable}
            disabled={isValidating || disabled}
            min={input.min}
            max={input.max}
            ref={setInputRef(input.name)}
        />
    );
}

export default DefaultTypedInput;
