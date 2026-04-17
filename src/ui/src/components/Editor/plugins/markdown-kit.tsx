/* eslint-disable @typescript-eslint/no-explicit-any */
import { MarkdownPlugin, remarkMdx } from "@platejs/markdown";
import { KEYS, bindFirst } from "platejs";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
    CodeDrawingMarkdown,
    EscapeMarkdown,
    HeadingListMarkdown,
    InternalLinkMarkdown,
    MentionMarkdown,
} from "@/components/Editor/plugins/markdown";

export const MarkdownKit = [
    MarkdownPlugin.configure({
        options: {
            disallowedNodes: [KEYS.suggestion],
            remarkPlugins: [CodeDrawingMarkdown.remark, remarkMath, remarkGfm, remarkMdx, InternalLinkMarkdown.remark, MentionMarkdown.remark],
            rules: {
                ...InternalLinkMarkdown.rules,
                ...(MentionMarkdown.rules as any),
                ...CodeDrawingMarkdown.rules,
            },
        },
    }).extendApi(({ editor }) => ({
        serialize: bindFirst(HeadingListMarkdown.serialize, editor),
        deserialize: (text, options) =>
            HeadingListMarkdown.deserialize(
                editor,
                text,
                (markdown, deserializeOptions) => EscapeMarkdown.deserialize(false)(editor, markdown, deserializeOptions),
                options
            ),
        deserializeInlineMd: bindFirst(EscapeMarkdown.deserialize(true), editor),
    })),
];
