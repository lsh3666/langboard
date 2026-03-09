import { Command as CommandPrimitive } from "cmdk";
import { useMemo, useRef, useState } from "react";
import Command from "@/components/base/Command";
import Popover from "@/components/base/Popover";
import Skeleton from "@/components/base/Skeleton";
import { cn } from "@/core/utils/ComponentUtils";
import IconComponent from "@/components/base/IconComponent";
import Flex from "@/components/base/Flex";
import Box from "@/components/base/Box";
import { Utils } from "@langboard/core/utils";
import Floating from "@/components/base/Floating";

export interface IAutorCompleteProps {
    selectedValue?: string;
    onValueChange: (value: string) => void;
    items: { value: string; label: string }[];
    isLoading?: bool;
    emptyMessage: string;
    placeholder: string;
    disabled?: bool;
    required?: bool;
    className?: string;
}

function AutoComplete({
    selectedValue,
    onValueChange,
    items,
    isLoading,
    emptyMessage,
    placeholder,
    disabled,
    required,
    className,
}: IAutorCompleteProps) {
    const id = useRef(Utils.String.Token.shortUUID());
    const [open, setOpen] = useState(false);
    const [currentValue, setCurrentValue] = useState(selectedValue);

    const labels = useMemo(
        () =>
            items.reduce(
                (acc, item) => {
                    acc[item.value] = item.label;
                    return acc;
                },
                {} as Record<string, string>
            ),
        [items]
    );

    const changeValue = (inputValue: string) => {
        onValueChange(inputValue);
        setCurrentValue(inputValue);
    };

    const onSelectItem = (inputValue: string) => {
        changeValue(inputValue);
        setOpen(false);
    };

    return (
        <Flex items="center" className={className}>
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Command.Root
                    className="overflow-visible"
                    shouldFilter={false}
                    onKeyDown={(e) => {
                        if (!open) {
                            e.preventDefault();
                            setOpen(true);
                        }
                    }}
                >
                    <Popover.Trigger asChild>
                        <CommandPrimitive.Input
                            asChild
                            id={id.current}
                            value={currentValue ? (labels[currentValue] ?? currentValue) : currentValue}
                            onValueChange={changeValue}
                            onKeyDown={(e) => {
                                if (e.key !== "Escape") {
                                    if (!open) {
                                        setOpen(true);
                                    }
                                    return;
                                }

                                setOpen(false);
                            }}
                        >
                            <Floating.LabelInput label={placeholder} required={required} autoComplete="off" disabled={disabled} />
                        </CommandPrimitive.Input>
                    </Popover.Trigger>
                    {!open && <Command.List aria-hidden="true" className="hidden" />}
                    <Popover.Content
                        asChild
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => {
                            if (!Utils.Type.isElement(e.target, "input")) {
                                return;
                            }

                            if (e.target.hasAttribute("cmdk-input") && e.target.id === id.current) {
                                e.preventDefault();
                            }
                        }}
                        className="w-[--radix-popover-trigger-width] p-0"
                    >
                        <Command.List>
                            {isLoading && (
                                <CommandPrimitive.Loading>
                                    <Box p="1">
                                        <Skeleton h="6" w="full" />
                                    </Box>
                                </CommandPrimitive.Loading>
                            )}
                            {items.length > 0 && !isLoading ? (
                                <Command.Group>
                                    {items.map((option) => (
                                        <Command.Item
                                            key={option.value}
                                            value={option.value}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onSelect={onSelectItem}
                                        >
                                            <IconComponent
                                                icon="check"
                                                size="4"
                                                className={cn("mr-2", currentValue === option.value ? "opacity-100" : "opacity-0")}
                                            />
                                            {option.label}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            ) : null}
                            {!isLoading ? <Command.Empty>{emptyMessage ?? "No items."}</Command.Empty> : null}
                        </Command.List>
                    </Popover.Content>
                </Command.Root>
            </Popover.Root>
        </Flex>
    );
}

export default AutoComplete;
