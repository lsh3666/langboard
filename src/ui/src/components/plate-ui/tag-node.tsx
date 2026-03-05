"use client";

import type { TTagElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { PlateElement, useFocused, useReadOnly, useSelected } from "platejs/react";
import { cn } from "@/core/utils/ComponentUtils";
import { IconComponent } from "@/components/base";
import { MultiSelectPlugin } from "@platejs/tag/react";

export type TTagElementProps = {
    createTagContent?: (props: TTagElement & { readOnly: bool }) => React.JSX.Element;
    itemRemovedCallback?: (item: TTagElement) => void;
};

export function TagElement(props: PlateElementProps<TTagElement> & TTagElementProps) {
    const { element, createTagContent, itemRemovedCallback, editor } = props;
    const selected = useSelected();
    const focused = useFocused();
    const readOnly = useReadOnly();
    const removeItem = (item: TTagElement) => {
        editor.getTransforms(MultiSelectPlugin).delete({
            at: editor.getApi(MultiSelectPlugin).findPath(item),
        });

        itemRemovedCallback?.(element);
    };

    const badge = (
        <div
            className={cn(
                "shrink-0 break-normal rounded-full border px-2.5 align-middle text-sm font-semibold transition-colors focus:outline-none",
                "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/60",
                selected && focused && "ring-2 ring-ring ring-offset-0",
                "flex items-center gap-1.5"
            )}
        >
            {createTagContent ? createTagContent({ ...element, readOnly }) : element.value}
            {!readOnly && <IconComponent icon="x" size="4" className="hover:text-secondary-foreground/70" onClick={() => removeItem(element)} />}
        </div>
    );

    return (
        <PlateElement
            {...props}
            className="m-0.5 inline-flex cursor-pointer select-none"
            attributes={{
                ...props.attributes,
                draggable: true,
            }}
        >
            {badge}
            {props.children}
        </PlateElement>
    );
}
