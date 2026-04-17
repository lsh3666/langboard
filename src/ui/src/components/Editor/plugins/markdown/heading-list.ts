import { type Descendant, getPluginKey, getPluginType, KEYS, type SlateEditor, type TElement } from "platejs";
import { type DeserializeMdOptions, serializeInlineMd, serializeMd } from "@platejs/markdown";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { List, ListItem, Root } from "mdast";

const headingDepthByKey: Record<string, number> = {
    h1: 1,
    h2: 2,
    h3: 3,
    h4: 4,
    h5: 5,
    h6: 6,
};

const headingTypeByDepth: Record<number, string> = {
    1: "h1",
    2: "h2",
    3: "h3",
    4: "h4",
    5: "h5",
    6: "h6",
};

type TListNode = TElement & {
    checked?: bool;
    indent?: number;
    listStart?: number;
    listStyleType?: string;
};

const isHeadingListNode = (editor: SlateEditor, node: Descendant): node is TListNode => {
    if (!node || typeof node !== "object" || !("type" in node)) {
        return false;
    }

    const key = getPluginKey(editor, node.type);
    return !!node.listStyleType && !!key && key in headingDepthByKey;
};

const getListMarker = (node: TListNode) => {
    switch (node.listStyleType) {
        case KEYS.ul:
            return "-";
        case KEYS.listTodo:
            return node.checked ? "- [x]" : "- [ ]";
        default:
            return `${node.listStart ?? 1}.`;
    }
};

const serializeHeadingListNode = (editor: SlateEditor, node: TListNode) => {
    const key = getPluginKey(editor, node.type) ?? node.type;
    const depth = headingDepthByKey[key];
    const indent = "   ".repeat(Math.max((node.indent ?? 1) - 1, 0));
    const marker = getListMarker(node);
    const headingMarker = `${"#".repeat(depth)} `;
    const content = serializeInlineMd(editor, { value: node.children });

    return `${indent}${marker} ${headingMarker}${content}\n`;
};

export const serialize = (editor: SlateEditor, options?: Parameters<typeof serializeMd>[1]) => {
    const value = options?.value ?? editor.children;
    const chunks: string[] = [];
    let bufferedNodes: Descendant[] = [];

    const flushBufferedNodes = () => {
        if (bufferedNodes.length === 0) {
            return;
        }

        chunks.push(serializeMd(editor, { ...options, value: bufferedNodes }));
        bufferedNodes = [];
    };

    for (const node of value) {
        if (isHeadingListNode(editor, node)) {
            flushBufferedNodes();
            chunks.push(serializeHeadingListNode(editor, node));
            continue;
        }

        bufferedNodes.push(node);
    }

    flushBufferedNodes();

    return chunks.join("");
};

const collectListHeadingDepths = (listNode: List, depths: Array<number | null> = []) => {
    listNode.children.forEach((listItem: ListItem) => {
        const [firstChild, ...restChildren] = listItem.children ?? [];
        depths.push(firstChild?.type === "heading" ? firstChild.depth : null);

        restChildren.forEach((child) => {
            if (child.type === "list") {
                collectListHeadingDepths(child, depths);
            }
        });
    });

    return depths;
};

export const restoreHeadingListTypes = (editor: SlateEditor, markdown: string, nodes: Descendant[]) => {
    const root = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
    const listHeadingDepths = root.children.flatMap((child) => (child.type === "list" ? collectListHeadingDepths(child) : []));

    if (listHeadingDepths.length === 0) {
        return nodes;
    }

    let listItemIndex = 0;

    return nodes.map((node) => {
        if (!node || typeof node !== "object" || !("type" in node) || !node.listStyleType) {
            return node;
        }

        const headingDepth = listHeadingDepths[listItemIndex++];
        if (!headingDepth) {
            return node;
        }

        return {
            ...node,
            type: getPluginType(editor, headingTypeByDepth[headingDepth]),
        };
    });
};

export const deserialize = (
    editor: SlateEditor,
    markdown: string,
    deserializeMarkdown: (text: string, options?: DeserializeMdOptions) => Descendant[],
    options?: DeserializeMdOptions
) => {
    const nodes = deserializeMarkdown(markdown, options);
    return restoreHeadingListTypes(editor, markdown, nodes);
};
