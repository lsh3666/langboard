"use client";

import * as React from "react";
import { type DropdownMenuProps, DropdownMenuItemIndicator } from "@radix-ui/react-dropdown-menu";
import { CheckIcon, EyeIcon, PenIcon } from "lucide-react";
import { useEditorRef, usePlateState } from "platejs/react";
import DropdownMenu from "@/components/base/DropdownMenu";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export function ModeToolbarButton(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const [readOnly, setReadOnly] = usePlateState("readOnly");
    const [open, setOpen] = React.useState(false);

    let value = "editing";

    if (readOnly) value = "viewing";

    const item: Record<string, { icon: React.ReactNode; label: string }> = {
        editing: {
            icon: <PenIcon className="size-4" />,
            label: t("editor.Editing"),
        },
        viewing: {
            icon: <EyeIcon className="size-4" />,
            label: t("editor.Viewing"),
        },
    };

    return (
        <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={open} tooltip={t("editor.Editing mode")} isDropdown>
                    {item[value].icon}
                    <span className="hidden lg:inline">{item[value].label}</span>
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="min-w-[180px]" align="start">
                <DropdownMenu.RadioGroup
                    value={value}
                    onValueChange={(newValue) => {
                        if (newValue === "viewing") {
                            setReadOnly(true);

                            return;
                        }

                        setReadOnly(false);

                        if (newValue === "editing") {
                            editor.tf.focus();

                            return;
                        }
                    }}
                >
                    <DropdownMenu.RadioItem className="*:first:[span]:hidden *:[svg]:text-muted-foreground pl-2" value="editing">
                        <Indicator />
                        {item.editing.icon}
                        {item.editing.label}
                    </DropdownMenu.RadioItem>

                    <DropdownMenu.RadioItem className="*:first:[span]:hidden *:[svg]:text-muted-foreground pl-2" value="viewing">
                        <Indicator />
                        {item.viewing.icon}
                        {item.viewing.label}
                    </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

function Indicator() {
    return (
        <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
            <DropdownMenuItemIndicator>
                <CheckIcon className="size-4" />
            </DropdownMenuItemIndicator>
        </span>
    );
}
