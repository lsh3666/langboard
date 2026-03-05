"use client";

import { useCallback, useState } from "react";
import { useEditorPlugin, useEditorSelector, usePlateState, usePluginOption } from "platejs/react";
import { AIChatPlugin } from "@platejs/ai/react";
import { KEYS } from "platejs";
import { BLOCK_CONTEXT_MENU_ID, BlockMenuPlugin, BlockSelectionPlugin, useBlockSelectionNodes } from "@platejs/selection/react";
import { useIsTouchDevice } from "@/core/hooks/useIsTouchDevice";
import { ContextMenu } from "@/components/base";
import { TableCellPlugin, TablePlugin, TableRowPlugin } from "@platejs/table/react";
import { useTranslation } from "react-i18next";

type Value = "askAI" | null;

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
    const [t] = useTranslation();
    const { api, editor } = useEditorPlugin(BlockMenuPlugin);
    const [value, setValue] = useState<Value>(null);
    const isTouch = useIsTouchDevice();
    const [readOnly] = usePlateState("readOnly");
    const openId = usePluginOption(BlockMenuPlugin, "openId");
    const isOpen = openId === BLOCK_CONTEXT_MENU_ID;
    const tableRelatedKeys: string[] = [TablePlugin.key, TableCellPlugin.key, TableRowPlugin.key];
    const tableRelatedSelected = useEditorSelector((editor) => editor.api.some({ match: { type: tableRelatedKeys } }), []);
    const tableRelatedSelectedInBlock = useBlockSelectionNodes()?.some(([node]) => node && node.type && tableRelatedKeys.includes(node.type));
    const tableSelected = tableRelatedSelected || tableRelatedSelectedInBlock;

    const handleTurnInto = useCallback(
        (type: string) => {
            editor
                .getApi(BlockSelectionPlugin)
                .blockSelection.getNodes()
                .forEach(([node, path]) => {
                    if (node[KEYS.listType]) {
                        editor.tf.unsetNodes([KEYS.listType, "indent"], {
                            at: path,
                        });
                    }

                    editor.tf.toggleBlock(type, { at: path });
                });
        },
        [editor]
    );

    if (isTouch) {
        return children;
    }

    return (
        <ContextMenu.Root
            onOpenChange={(open) => {
                if (!open) {
                    // prevent unselect the block selection
                    setTimeout(() => {
                        api.blockMenu.hide();
                    }, 0);
                }
            }}
            modal={false}
        >
            <ContextMenu.Trigger
                asChild
                onContextMenu={(event) => {
                    const dataset = (event.target as HTMLElement).dataset;

                    const disabled = dataset?.slateEditor === "true" || readOnly || dataset?.plateOpenContextMenu === "false";

                    if (disabled) return event.preventDefault();

                    api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
                        x: event.clientX,
                        y: event.clientY,
                    });
                }}
            >
                <div className="w-full">{children}</div>
            </ContextMenu.Trigger>
            {isOpen && (
                <ContextMenu.Content
                    className="w-64"
                    onCloseAutoFocus={(e) => {
                        e.preventDefault();
                        editor.getApi(BlockSelectionPlugin).blockSelection.focus();

                        if (value === "askAI") {
                            editor.getApi(AIChatPlugin).aiChat.show();
                        }

                        setValue(null);
                    }}
                >
                    <ContextMenu.Group>
                        <ContextMenu.Item
                            onClick={() => {
                                setValue("askAI");
                            }}
                        >
                            {t("editor.Ask AI")}
                        </ContextMenu.Item>
                        <ContextMenu.Item
                            onClick={() => {
                                editor.getTransforms(BlockSelectionPlugin).blockSelection.removeNodes();
                                editor.tf.focus();
                            }}
                        >
                            {t("editor.Delete")}
                        </ContextMenu.Item>
                        <ContextMenu.Item
                            onClick={() => {
                                editor.getTransforms(BlockSelectionPlugin).blockSelection.duplicate();
                            }}
                        >
                            {t("editor.Duplicate")}
                            {/* <ContextMenu.Shortcut>⌘ + D</ContextMenu.Shortcut> */}
                        </ContextMenu.Item>
                        <ContextMenu.Sub>
                            <ContextMenu.SubTrigger disabled={tableSelected}>{t("editor.Turn into")}</ContextMenu.SubTrigger>
                            <ContextMenu.SubContent className="w-48">
                                <ContextMenu.Item onClick={() => handleTurnInto(KEYS.p)}>{t("editor.Paragraph")}</ContextMenu.Item>

                                <ContextMenu.Item onClick={() => handleTurnInto(KEYS.h1)}>{t("editor.Heading 1")}</ContextMenu.Item>
                                <ContextMenu.Item onClick={() => handleTurnInto(KEYS.h2)}>{t("editor.Heading 2")}</ContextMenu.Item>
                                <ContextMenu.Item onClick={() => handleTurnInto(KEYS.h3)}>{t("editor.Heading 3")}</ContextMenu.Item>
                                <ContextMenu.Item onClick={() => handleTurnInto(KEYS.blockquote)}>{t("editor.Blockquote")}</ContextMenu.Item>
                            </ContextMenu.SubContent>
                        </ContextMenu.Sub>
                    </ContextMenu.Group>

                    <ContextMenu.Group>
                        <ContextMenu.Item onClick={() => editor.getTransforms(BlockSelectionPlugin).blockSelection.setIndent(1)}>
                            {t("editor.Indent")}
                        </ContextMenu.Item>
                        <ContextMenu.Item onClick={() => editor.getTransforms(BlockSelectionPlugin).blockSelection.setIndent(-1)}>
                            {t("editor.Outdent")}
                        </ContextMenu.Item>
                    </ContextMenu.Group>
                </ContextMenu.Content>
            )}
        </ContextMenu.Root>
    );
}
