"use client";

import { InlineComboboxItem } from "@/components/plate-ui/inline-combobox";
import { ProjectCard, ProjectWiki } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { PlateEditor } from "platejs/react";
import { TInternalLinkableModel, TInternalLinkElement } from "@/components/Editor/plugins/customs/internal-link/InternalLinkPlugin";
import { getInternalLinkOnSelectItem } from "@/components/Editor/plugins/customs/internal-link/getInternalLinkOnSelectItem";

const onSelectItem = getInternalLinkOnSelectItem();

export interface IInternalLinkInputComboboxItemProps {
    search: string;
    linkable: { raw: TInternalLinkableModel; value: TInternalLinkElement };
    editor: PlateEditor;
}

interface IInternalLinkInputComboboxItemInnerProps extends IInternalLinkInputComboboxItemProps {
    value: TInternalLinkElement;
}

export const InternalLinkInputComboboxItem = ({ linkable, ...props }: IInternalLinkInputComboboxItemProps) => {
    switch (linkable.value.internalType) {
        case "card":
            return (
                <InternalLinkInputComboboxCardItem card={linkable.raw as ProjectCard.TModel & { title: string }} value={linkable.value} {...props} />
            );
        case "project_wiki":
            return (
                <InternalLinkInputComboboxWikiItem wiki={linkable.raw as ProjectWiki.TModel & { title: string }} value={linkable.value} {...props} />
            );
        default:
            return null;
    }
};

const InternalLinkInputComboboxCardItem = ({
    card,
    value,
    ...props
}: Omit<IInternalLinkInputComboboxItemInnerProps, "linkable"> & { card: ProjectCard.TModel }) => {
    const title = card.useField("title");
    const columnName = card.useField("column_name");

    return (
        <InternalLinkInputComboboxItemInner
            {...props}
            value={`${card.uid} ${title} ${columnName}`}
            title={title}
            linkable={{
                raw: card,
                value,
            }}
        />
    );
};

const InternalLinkInputComboboxWikiItem = ({
    wiki,
    value,
    ...props
}: Omit<IInternalLinkInputComboboxItemInnerProps, "linkable"> & { wiki: ProjectWiki.TModel }) => {
    const title = wiki.useField("title");

    return (
        <InternalLinkInputComboboxItemInner
            {...props}
            value={`${wiki.uid} ${title}`}
            title={title}
            linkable={{
                raw: wiki,
                value,
            }}
        />
    );
};

const InternalLinkInputComboboxItemInner = ({
    search,
    value,
    title,
    linkable,
    editor,
}: Omit<IInternalLinkInputComboboxItemInnerProps, "value"> & { value: string; title: string }) => {
    return (
        <InlineComboboxItem
            key={Utils.String.Token.shortUUID()}
            value={value}
            onClick={() => onSelectItem(editor, linkable.value, search)}
            className="h-auto p-2"
        >
            <div className="text-sm leading-none">{title}</div>
        </InlineComboboxItem>
    );
};
