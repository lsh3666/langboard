"use client";

import React from "react";
import { getPluginKey, KEYS, type TListElement } from "platejs";
import { isOrderedList } from "@platejs/list";
import { useTodoListElement, useTodoListElementState } from "@platejs/list/react";
import { type PlateElementProps, type RenderNodeWrapper, useReadOnly } from "platejs/react";
import Checkbox from "@/components/base/Checkbox";
import { cn } from "@/core/utils/ComponentUtils";

const config: Record<
    string,
    {
        Li: React.FC<PlateElementProps>;
        Marker: React.FC<PlateElementProps>;
    }
> = {
    todo: {
        Li: TodoLi,
        Marker: TodoMarker,
    },
};

const headingListItemClassName = "[&>h1]:mt-0 [&>h2]:mt-0 [&>h3]:mt-0 [&>h4]:mt-0 [&>h5]:mt-0 [&>h6]:mt-0";
const headingListClassName = "pl-6";

export const BlockList: RenderNodeWrapper = (props) => {
    if (!props.element.listStyleType) return;

    return (props) => <List {...props} />;
};

function List(props: PlateElementProps) {
    const { listStart, listStyleType } = props.element as TListElement;
    const { Li, Marker } = config[listStyleType] ?? {};
    const List = isOrderedList(props.element) ? "ol" : "ul";
    const elementKey = getPluginKey(props.editor, props.element.type);
    const isHeadingListItem = !!elementKey && KEYS.heading.includes(elementKey);

    return (
        <List className={cn("relative m-0 p-0", isHeadingListItem && headingListClassName)} style={{ listStyleType }} start={listStart}>
            {Marker && <Marker {...props} />}
            {Li ? <Li {...props} /> : <li className={cn(isHeadingListItem && headingListItemClassName)}>{props.children}</li>}
        </List>
    );
}

function TodoMarker(props: PlateElementProps) {
    const state = useTodoListElementState({ element: props.element });
    const { checkboxProps } = useTodoListElement(state);
    const readOnly = useReadOnly();

    return (
        <div contentEditable={false}>
            <Checkbox className={cn("absolute -left-6 top-1", readOnly && "pointer-events-none")} {...checkboxProps} />
        </div>
    );
}

function TodoLi(props: PlateElementProps) {
    return <li className={cn("list-none", (props.element.checked as bool) && "text-muted-foreground line-through")}>{props.children}</li>;
}
