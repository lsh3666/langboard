/* eslint-disable @typescript-eslint/no-explicit-any */
import { MarkdownPlugin, remarkMdx } from "@platejs/markdown";
import { KEYS, bindFirst } from "platejs";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { EscapeMarkdown, InternalLinkMarkdown, MentionMarkdown, PlantUMLMarkdown } from "@/components/Editor/plugins/markdown";

export const MarkdownKit = [
    MarkdownPlugin.configure({
        options: {
            disallowedNodes: [KEYS.suggestion],
            remarkPlugins: [PlantUMLMarkdown.remark, remarkMath, remarkGfm, remarkMdx, InternalLinkMarkdown.remark, MentionMarkdown.remark],
            rules: {
                ...InternalLinkMarkdown.rules,
                ...(MentionMarkdown.rules as any),
                ...PlantUMLMarkdown.rules,
            },
        },
    }).extendApi(({ editor }) => ({
        deserialize: bindFirst(EscapeMarkdown.deserialize(false), editor),
        deserializeInlineMd: bindFirst(EscapeMarkdown.deserialize(true), editor),
    })),
];
