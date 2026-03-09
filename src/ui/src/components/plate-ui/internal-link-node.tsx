"use client";

import React from "react";
import { KEYS, TComboboxInputElement } from "platejs";
import { cn } from "@/core/utils/ComponentUtils";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { isModel } from "@/core/models/ModelRegistry";
import { PlateElement, PlateElementProps, useFocused, useReadOnly, useSelected } from "platejs/react";
import {
    InlineCombobox,
    InlineComboboxContent,
    InlineComboboxEmpty,
    InlineComboboxGroup,
    InlineComboboxInput,
} from "@/components/plate-ui/inline-combobox";
import { useTranslation } from "react-i18next";
import { Utils } from "@langboard/core/utils";
import { TInternalLinkableModel, TInternalLinkElement } from "@/components/Editor/plugins/customs/internal-link/InternalLinkPlugin";
import { IInternalLinkInputComboboxItemProps, InternalLinkInputComboboxItem } from "@/components/plate-ui/internal-link-input-combobox-item";
import IconComponent from "@/components/base/IconComponent";
import { ProjectCard, ProjectWiki } from "@/core/models";
import InternalLinkElementDialog from "@/components/plate-ui/internal-link-node-dialog";

export function InternalLinkElement(
    props: PlateElementProps<TInternalLinkElement> & {
        prefix?: string;
    }
) {
    const element = props.element;
    const { linkables, createInternalLink } = useEditorData();
    const selected = useSelected();
    const focused = useFocused();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const linked = linkables.find((linkable) => linkable.uid === element.uid) ?? element;
    const icon = React.useMemo(() => {
        const linkable = linkables.find((val) => val.uid === element.uid);
        if (isModel(linkable, "ProjectCard")) {
            return "credit-card";
        } else if (isModel(linkable, "ProjectWiki")) {
            return "brain";
        } else {
            return "circle-slash";
        }
    }, [element, linkables]);
    const toLink = createInternalLink(element.internalType, element.uid);
    const handleClick = React.useCallback(() => {
        setDialogOpen(true);
    }, [setDialogOpen]);

    const readOnly = useReadOnly();

    return (
        <>
            <PlateElement
                {...props}
                className={cn(
                    "internal-link inline-flex cursor-pointer items-center gap-1",
                    "rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium",
                    !readOnly && "cursor-pointer",
                    selected && focused && "ring-2 ring-ring",
                    element.children[0][KEYS.bold] === true && "font-bold",
                    element.children[0][KEYS.italic] === true && "italic",
                    element.children[0][KEYS.underline] === true && "underline"
                )}
                attributes={{
                    ...props.attributes,
                    contentEditable: false,
                    "data-slate-value": element.value,
                    draggable: true,
                    onPointerDown: readOnly ? handleClick : undefined,
                }}
            >
                <IconComponent icon={icon} size="4" />
                <InternalLinkLabel linkable={linked} />
            </PlateElement>
            <InternalLinkElementDialog isOpened={dialogOpen} setIsOpened={setDialogOpen} toLink={toLink} />
        </>
    );
}

export function InternalLinkInputElement(props: PlateElementProps<TComboboxInputElement>) {
    const { editor, element } = props;
    const [t] = useTranslation();
    const { linkables: flatLinkables } = useEditorData();
    const [search, setSearch] = React.useState("");
    const linkables = React.useMemo(() => {
        const items: IInternalLinkInputComboboxItemProps["linkable"][] = [];
        for (let i = 0; i < flatLinkables.length; ++i) {
            const linkable = flatLinkables[i];

            let title;
            let type: TInternalLinkElement["internalType"];
            if (isModel(linkable, "ProjectCard")) {
                title = linkable.title;
                type = "card";
            } else if (isModel(linkable, "ProjectWiki")) {
                title = linkable.title;
                type = "project_wiki";
            } else {
                continue;
            }

            const fakeLinkable = linkable.asFake() as unknown as TInternalLinkElement;
            fakeLinkable.internalType = type;
            fakeLinkable.uid = linkable.uid;
            fakeLinkable.title = title;

            items.push({ raw: linkable, value: fakeLinkable });
        }
        return items;
    }, [flatLinkables]);

    return (
        <PlateElement {...props} as="span">
            <InlineCombobox value={search} element={element} setValue={setSearch} showTrigger={false} trigger="[[">
                <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
                    <InlineComboboxInput />
                </span>

                <InlineComboboxContent className="my-1.5">
                    <InlineComboboxEmpty>{t("editor.No results")}</InlineComboboxEmpty>

                    <InlineComboboxGroup>
                        {linkables.map((linkable) => (
                            <InternalLinkInputComboboxItem key={Utils.String.Token.shortUUID()} search={search} linkable={linkable} editor={editor} />
                        ))}
                    </InlineComboboxGroup>
                </InlineComboboxContent>
            </InlineCombobox>

            {props.children}
        </PlateElement>
    );
}

const InternalLinkLabel = ({ linkable }: { linkable: TInternalLinkElement | TInternalLinkableModel }) => {
    if (isModel(linkable, "ProjectCard")) {
        return <InternalLinkLabelCardItem linkable={linkable} />;
    } else if (isModel(linkable, "ProjectWiki")) {
        return <InternalLinkLabelWikiItem linkable={linkable} />;
    } else {
        return (linkable as TInternalLinkElement).uid || "Unknown";
    }
};

const InternalLinkLabelCardItem = ({ linkable }: { linkable: ProjectCard.TModel }) => {
    const title = linkable.useField("title");

    return <>{title}</>;
};

const InternalLinkLabelWikiItem = ({ linkable }: { linkable: ProjectWiki.TModel }) => {
    const title = linkable.useField("title");

    return <>{title}</>;
};
