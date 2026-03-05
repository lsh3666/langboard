"use client";

import type { Node, Parent } from "mdast";
import { MdMath } from "@platejs/markdown";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { KEYS } from "platejs";
import { CODE_DRAWING_TYPE, CodeDrawingType, TCodeDrawingElement, VIEW_MODE } from "@platejs/code-drawing";

export type TCodeDrawingNode = Omit<MdMath, "type"> & {
    value: string;
    meta?: CodeDrawingType;
    type: typeof KEYS.codeDrawing;
};

declare module "mdast" {
    interface RootContentMap {
        [KEYS.codeDrawing]: TCodeDrawingNode;
    }
}

export const remark: Plugin = function () {
    return (tree: Node) => {
        visit(tree, "math", (node: MdMath, index: number, parent: Parent | undefined) => {
            if (!node.meta || !parent || typeof index !== "number") {
                return;
            }

            const meta = node.meta as CodeDrawingType;
            if (!CODE_DRAWING_TYPE[meta]) {
                return;
            }

            parent.children.splice(index, 1, {
                ...node,
                type: KEYS.codeDrawing,
                value: node.value,
                meta,
            });
        });
    };
};

export const rules = {
    [KEYS.codeDrawing]: {
        deserialize: (node: TCodeDrawingNode): TCodeDrawingElement => ({
            children: [{ text: "" }],
            type: KEYS.codeDrawing,
            data: {
                drawingType: node.meta || CODE_DRAWING_TYPE.PlantUml,
                drawingMode: VIEW_MODE.Both,
                code: node.value,
            },
        }),
        serialize: (node: TCodeDrawingElement) => ({
            type: "math",
            meta: node.data?.drawingType || CODE_DRAWING_TYPE.PlantUml,
            value: node.data?.code || "",
        }),
    },
};
