/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { AIChatPlugin } from "@platejs/ai/react";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { getPluginTypes, isHotkey, KEYS } from "platejs";
import { BlockSelection } from "@/components/plate-ui/block-selection";

export const BlockSelectionKit = [
    BlockSelectionPlugin.configure(({ editor }) => ({
        options: {
            enableContextMenu: true,
            isSelectable: (element, path) => {
                return (
                    !getPluginTypes(editor, [KEYS.column, KEYS.codeLine, KEYS.td]).includes(element.type) &&
                    !editor.api.block({ above: true, at: path, match: { type: "tr" } })
                );
            },
            onKeyDownSelecting: (editor, e) => {
                if (isHotkey("mod+j")(e)) {
                    editor.getApi(AIChatPlugin).aiChat.show();
                }
            },
        },
        render: {
            belowRootNodes: (props) => {
                if (!props.attributes.className?.includes("slate-selectable")) {
                    return null;
                }

                return <BlockSelection {...(props as any)} />;
            },
        },
    })),
];
