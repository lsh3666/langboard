/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { KeyboardIcon, MoreHorizontalIcon, RadicalIcon, SubscriptIcon, SuperscriptIcon } from "lucide-react";
import { KEYS } from "platejs";
import { useEditorRef } from "platejs/react";
import DropdownMenu from "@/components/base/DropdownMenu";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export function MoreToolbarButton(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const [open, setOpen] = React.useState(false);

    return (
        <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={open} tooltip={t("editor.Insert")}>
                    <MoreHorizontalIcon />
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="ignore-click-outside/toolbar flex max-h-[500px] min-w-[180px] flex-col overflow-y-auto" align="start">
                <DropdownMenu.Group>
                    <DropdownMenu.Item
                        onSelect={() => {
                            editor.tf.toggleMark(KEYS.kbd);
                            editor.tf.collapse({ edge: "end" });
                            editor.tf.focus();
                        }}
                    >
                        <KeyboardIcon className="size-4" />
                        {t("editor.Keyboard input")}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={() => {
                            (editor.tf as any).insert.inlineEquation();
                        }}
                    >
                        <RadicalIcon className="size-4" />
                        {t("editor.Inline equation")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onSelect={() => {
                            editor.tf.toggleMark(KEYS.sup, {
                                remove: KEYS.sub,
                            });
                            editor.tf.focus();
                        }}
                    >
                        <SuperscriptIcon className="size-4" />
                        {t("editor.Superscript")}
                        {/* (⌘+,) */}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onSelect={() => {
                            editor.tf.toggleMark(KEYS.sub, {
                                remove: KEYS.sup,
                            });
                            editor.tf.focus();
                        }}
                    >
                        <SubscriptIcon className="size-4" />
                        {t("editor.Subscript")}
                        {/* (⌘+.) */}
                    </DropdownMenu.Item>
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
