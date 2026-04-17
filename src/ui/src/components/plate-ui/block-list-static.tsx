/* eslint-disable @/max-len */
import * as React from "react";
import { getPluginKey, KEYS, type RenderStaticNodeWrapper, type TListElement } from "platejs";
import type { SlateRenderElementProps } from "platejs/static";
import { isOrderedList } from "@platejs/list";
import { CheckIcon } from "lucide-react";
import { cn } from "@/core/utils/ComponentUtils";

const config: Record<
    string,
    {
        Li: React.FC<SlateRenderElementProps>;
        Marker: React.FC<SlateRenderElementProps>;
    }
> = {
    todo: {
        Li: TodoLiStatic,
        Marker: TodoMarkerStatic,
    },
};

const headingListItemClassName = "[&>h1]:mt-0 [&>h2]:mt-0 [&>h3]:mt-0 [&>h4]:mt-0 [&>h5]:mt-0 [&>h6]:mt-0";
const headingListClassName = "pl-6";

export const BlockListStatic: RenderStaticNodeWrapper = (props) => {
    if (!props.element.listStyleType) return;

    return (props) => <List {...props} />;
};

function List(props: SlateRenderElementProps) {
    const { indent, listStart, listStyleType } = props.element as TListElement & {
        indent?: number;
    };
    const { Li, Marker } = config[listStyleType] ?? {};
    const List = isOrderedList(props.element) ? "ol" : "ul";
    const elementKey = getPluginKey(props.editor, props.element.type);
    const isHeadingListItem = !!elementKey && KEYS.heading.includes(elementKey);

    // Apply margin-left for indent (24px per level) for DOCX export compatibility
    const marginLeft = indent ? `${indent * 24}px` : undefined;

    return (
        <List className={cn("relative m-0 p-0", isHeadingListItem && headingListClassName)} style={{ listStyleType, marginLeft }} start={listStart}>
            {Marker && <Marker {...props} />}
            {Li ? <Li {...props} /> : <li className={cn(isHeadingListItem && headingListItemClassName)}>{props.children}</li>}
        </List>
    );
}

function TodoMarkerStatic(props: SlateRenderElementProps) {
    const checked = props.element.checked as bool;

    return (
        <div contentEditable={false}>
            <button
                className={cn(
                    "peer pointer-events-none absolute -left-6 top-1 size-4 shrink-0 rounded-sm border border-primary bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                    props.className
                )}
                data-state={checked ? "checked" : "unchecked"}
                type="button"
            >
                <div className={cn("flex items-center justify-center text-current")}>{checked && <CheckIcon className="size-4" />}</div>
            </button>
        </div>
    );
}

function TodoLiStatic(props: SlateRenderElementProps) {
    return <li className={cn("list-none", (props.element.checked as bool) && "text-muted-foreground line-through")}>{props.children}</li>;
}
