"use client";

import * as React from "react";
import type { PlateEditor, PlateElementProps } from "platejs/react";
import { AIChatPlugin } from "@platejs/ai/react";
import {
    CalendarIcon,
    Code2,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    LightbulbIcon,
    ListIcon,
    ListOrdered,
    PilcrowIcon,
    Quote,
    RadicalIcon,
    SparklesIcon,
    Square,
    Table,
    TableOfContentsIcon,
} from "lucide-react";
import { type TComboboxInputElement, KEYS } from "platejs";
import { PlateElement } from "platejs/react";
import { insertBlock, insertInlineElement } from "@/components/Editor/transforms";
import {
    InlineCombobox,
    InlineComboboxContent,
    InlineComboboxEmpty,
    InlineComboboxGroup,
    InlineComboboxGroupLabel,
    InlineComboboxInput,
    InlineComboboxItem,
} from "@/components/plate-ui/inline-combobox";
import { useTranslation } from "react-i18next";

type Group = {
    group: string;
    items: {
        icon: React.ReactNode;
        value: string;
        onSelect: (editor: PlateEditor, value: string) => void;
        className?: string;
        focusEditor?: bool;
        keywords?: string[];
        label?: string;
    }[];
};

const groups: Group[] = [
    {
        group: "editor.AI",
        items: [
            {
                focusEditor: false,
                icon: <SparklesIcon />,
                value: "AI",
                label: "editor.AI",
                onSelect: (editor) => {
                    editor.getApi(AIChatPlugin).aiChat.show();
                },
            },
        ],
    },
    {
        group: "editor.Basic blocks",
        items: [
            {
                icon: <PilcrowIcon />,
                keywords: ["paragraph"],
                label: "editor.Text",
                value: KEYS.p,
            },
            {
                icon: <Heading1Icon />,
                keywords: ["title", "h1"],
                label: "editor.Heading 1",
                value: KEYS.h1,
            },
            {
                icon: <Heading2Icon />,
                keywords: ["subtitle", "h2"],
                label: "editor.Heading 2",
                value: KEYS.h2,
            },
            {
                icon: <Heading3Icon />,
                keywords: ["subtitle", "h3"],
                label: "editor.Heading 3",
                value: KEYS.h3,
            },
            {
                icon: <ListIcon />,
                keywords: ["unordered", "ul", "-"],
                label: "editor.Bulleted list",
                value: KEYS.ul,
            },
            {
                icon: <ListOrdered />,
                keywords: ["ordered", "ol", "1"],
                label: "editor.Numbered list",
                value: KEYS.ol,
            },
            {
                icon: <Square />,
                keywords: ["checklist", "task", "checkbox", "[]"],
                label: "editor.To-do list",
                value: KEYS.listTodo,
            },
            {
                icon: <Code2 />,
                keywords: ["```"],
                label: "editor.Code Block",
                value: KEYS.codeBlock,
            },
            {
                icon: <Table />,
                label: "editor.Table",
                value: KEYS.table,
            },
            {
                icon: <Quote />,
                keywords: ["citation", "blockquote", "quote", ">"],
                label: "editor.Blockquote",
                value: KEYS.blockquote,
            },
            {
                icon: <LightbulbIcon />,
                keywords: ["note"],
                label: "editor.Callout",
                value: KEYS.callout,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "editor.Advanced blocks",
        items: [
            {
                icon: <TableOfContentsIcon />,
                keywords: ["toc"],
                label: "editor.Table of contents",
                value: KEYS.toc,
            },
            {
                icon: <RadicalIcon />,
                label: "editor.Equation",
                value: KEYS.equation,
            },
            {
                icon: <Code2 />,
                label: "editor.Code Drawing",
                value: KEYS.codeDrawing,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "editor.Inline",
        items: [
            {
                focusEditor: true,
                icon: <CalendarIcon />,
                keywords: ["time"],
                label: "editor.Date",
                value: KEYS.date,
            },
            {
                focusEditor: false,
                icon: <RadicalIcon />,
                label: "editor.Inline equation",
                value: KEYS.inlineEquation,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertInlineElement(editor, value);
            },
        })),
    },
];

export function SlashInputElement(props: PlateElementProps<TComboboxInputElement>) {
    const [t] = useTranslation();
    const { editor, element } = props;

    return (
        <PlateElement {...props} as="span">
            <InlineCombobox element={element} trigger="/">
                <InlineComboboxInput />

                <InlineComboboxContent>
                    <InlineComboboxEmpty>{t("editor.No results")}</InlineComboboxEmpty>

                    {groups.map(({ group, items }) => (
                        <InlineComboboxGroup key={group}>
                            <InlineComboboxGroupLabel>{t(group)}</InlineComboboxGroupLabel>

                            {items.map(({ focusEditor, icon, keywords, label, value, onSelect }) => (
                                <InlineComboboxItem
                                    key={value}
                                    value={value}
                                    onClick={() => onSelect(editor, value)}
                                    label={label ? t(label) : undefined}
                                    focusEditor={focusEditor}
                                    group={group}
                                    keywords={keywords}
                                >
                                    <div className="mr-2 text-muted-foreground">{icon}</div>
                                    {t(label ?? value)}
                                </InlineComboboxItem>
                            ))}
                        </InlineComboboxGroup>
                    ))}
                </InlineComboboxContent>
            </InlineCombobox>

            {props.children}
        </PlateElement>
    );
}
