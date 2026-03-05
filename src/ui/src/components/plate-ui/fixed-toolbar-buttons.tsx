"use client";

import { KEYS } from "platejs";
import { useEditorReadOnly } from "platejs/react";
import { BoldIcon, Code2Icon, HighlighterIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from "lucide-react";
import { MoreToolbarButton } from "@/components/plate-ui/more-toolbar-button";
import { AIToolbarButton } from "@/components/plate-ui/ai-toolbar-button";
import { EmojiToolbarButton } from "@/components/plate-ui/emoji-toolbar-button";
import { RedoToolbarButton, UndoToolbarButton } from "@/components/plate-ui/history-toolbar-button";
import { IndentListToolbarButton, TodoListToolbarButton } from "@/components/plate-ui/list-toolbar-button";
import { IndentToolbarButton, OutdentToolbarButton } from "@/components/plate-ui/indent-toolbar-button";
import { InsertToolbarButton } from "@/components/plate-ui/insert-toolbar-button";
import { LinkToolbarButton } from "@/components/plate-ui/link-toolbar-button";
import { MarkToolbarButton } from "@/components/plate-ui/mark-toolbar-button";
import { MediaToolbarButton } from "@/components/plate-ui/media-toolbar-button";
import { TableToolbarButton } from "@/components/plate-ui/table-toolbar-button";
import { ToolbarGroup } from "@/components/plate-ui/toolbar";
import { TurnIntoToolbarButton } from "@/components/plate-ui/turn-into-toolbar-button";
import { useTranslation } from "react-i18next";

export function FixedToolbarButtons() {
    const [t] = useTranslation();
    const readOnly = useEditorReadOnly();

    if (readOnly) {
        return null;
    }

    return (
        <div className="flex w-full">
            <ToolbarGroup>
                <UndoToolbarButton />
                <RedoToolbarButton />
            </ToolbarGroup>

            <ToolbarGroup>
                <AIToolbarButton tooltip={t("editor.AI commands")}>
                    <WandSparklesIcon />
                </AIToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
                <InsertToolbarButton />
                <TurnIntoToolbarButton />
            </ToolbarGroup>

            <ToolbarGroup>
                <MarkToolbarButton nodeType={KEYS.bold} tooltip={t("editor.Bold (⌘+B)")}>
                    <BoldIcon />
                </MarkToolbarButton>

                <MarkToolbarButton nodeType={KEYS.italic} tooltip={t("editor.Italic (⌘+I)")}>
                    <ItalicIcon />
                </MarkToolbarButton>

                <MarkToolbarButton nodeType={KEYS.underline} tooltip={t("editor.Underline (⌘+U)")}>
                    <UnderlineIcon />
                </MarkToolbarButton>

                <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip={t("editor.Strikethrough (⌘+⇧+M)")}>
                    <StrikethroughIcon />
                </MarkToolbarButton>

                <MarkToolbarButton nodeType={KEYS.code} tooltip={t("editor.Code (⌘+E)")}>
                    <Code2Icon />
                </MarkToolbarButton>

                <MoreToolbarButton />
            </ToolbarGroup>

            <ToolbarGroup>
                <IndentListToolbarButton />
                <TodoListToolbarButton />
            </ToolbarGroup>

            <ToolbarGroup>
                <LinkToolbarButton />
                <TableToolbarButton />
                <EmojiToolbarButton />
            </ToolbarGroup>

            <ToolbarGroup>
                <MediaToolbarButton nodeType={KEYS.img} />
                <MediaToolbarButton nodeType={KEYS.video} />
                <MediaToolbarButton nodeType={KEYS.audio} />
                <MediaToolbarButton nodeType={KEYS.file} />
            </ToolbarGroup>

            <ToolbarGroup>
                <OutdentToolbarButton />
                <IndentToolbarButton />
            </ToolbarGroup>

            <div className="grow" />

            <ToolbarGroup>
                <MarkToolbarButton nodeType={KEYS.highlight} tooltip={t("editor.Highlight")}>
                    <HighlighterIcon />
                </MarkToolbarButton>
            </ToolbarGroup>
        </div>
    );
}
