/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useLinkToolbarButton, useLinkToolbarButtonState } from "@platejs/link/react";
import { Cable, ExternalLink, Link } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";
import { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { useEditorRef } from "platejs/react";
import DropdownMenu from "@/components/base/DropdownMenu";

export function LinkToolbarButton(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const [open, setOpen] = React.useState(false);
    const state = useLinkToolbarButtonState();
    const { props: externalButtonProps } = useLinkToolbarButton(state);
    const handleInternalButtonClick = () => {
        editor.tf.insertText("{{");
    };

    return (
        <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={open} tooltip={t("editor.Insert")} isDropdown>
                    <Link />
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="flex max-h-[min(70vh,300px)] min-w-0 flex-col overflow-y-auto" align="start">
                <DropdownMenu.Group>
                    <DropdownMenu.Item
                        className="min-w-[180px]"
                        onClick={externalButtonProps.onClick}
                        onMouseDown={externalButtonProps.onMouseDown as any}
                    >
                        <ExternalLink className="size-4" />
                        {t("editor.External link")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="min-w-[180px]" onClick={handleInternalButtonClick}>
                        <Cable className="size-4" />
                        {t("editor.Internal link")}
                    </DropdownMenu.Item>
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
