import Input, { InputProps } from "@/components/base/Input";
import { ICollaborativeTextCursor, useCollaborativeText } from "@/components/Collaborative/useCollaborativeText";
import { composeRefs } from "@/core/utils/ComponentUtils";
import { TEditorCollaborationType } from "@langboard/core/constants";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";

export interface ICollaborativeInputProps extends Omit<InputProps, "value" | "onChange"> {
    collaborationType?: TEditorCollaborationType;
    documentID?: string;
    field: string;
    section?: number | string;
    uid?: number | string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onValueChange?: (value: string) => void;
}

interface ICursorOverlayPosition {
    caretHeight: number;
    caretLeft: number;
    highlightHeight: number;
    highlightLeft: number;
    highlightWidth: number;
    top: number;
}

const createMeasureMarker = () => {
    const marker = document.createElement("span");
    marker.style.display = "inline-block";
    marker.style.width = "0";
    marker.style.padding = "0";
    marker.style.margin = "0";
    marker.style.border = "0";
    marker.style.overflow = "hidden";
    marker.textContent = "\u200b";
    return marker;
};

const CollaborativeInput = React.forwardRef<HTMLInputElement, ICollaborativeInputProps>(
    (
        {
            collaborationType,
            documentID,
            field,
            section,
            uid,
            defaultValue,
            disabled,
            onChange,
            onSelect,
            onKeyUp,
            onClick,
            onFocus,
            onMouseUp,
            onValueChange,
            ...props
        },
        ref
    ) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const { remoteCursors, updateSelection, value, updateValue } = useCollaborativeText({
            collaborationType,
            documentID,
            field,
            section,
            uid,
            defaultValue,
            disabled,
            onValueChange,
        });
        const [cursorPositions, setCursorPositions] = useState<Record<number, ICursorOverlayPosition>>({});

        const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
            updateValue(event.target.value);
            updateSelection(event.target.selectionStart ?? 0, event.target.selectionEnd ?? event.target.selectionStart ?? 0);
            onChange?.(event);
        };

        const handleClick: React.MouseEventHandler<HTMLInputElement> = (event) => {
            updateLocalSelection();
            onClick?.(event);
        };

        const handleFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
            updateLocalSelection();
            onFocus?.(event);
        };

        const handleKeyUp: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
            updateLocalSelection();
            onKeyUp?.(event);
        };

        const handleSelect: React.ReactEventHandler<HTMLInputElement> = (event) => {
            updateLocalSelection();
            onSelect?.(event);
        };

        const handleMouseUp: React.MouseEventHandler<HTMLInputElement> = (event) => {
            updateLocalSelection();
            onMouseUp?.(event);
        };

        const updateLocalSelection = useCallback(() => {
            const input = inputRef.current;
            if (!input) {
                return;
            }

            updateSelection(input.selectionStart ?? 0, input.selectionEnd ?? input.selectionStart ?? 0);
        }, [updateSelection]);

        useLayoutEffect(() => {
            const input = inputRef.current;
            if (!input || !remoteCursors.length) {
                setCursorPositions({});
                return;
            }

            const styles = window.getComputedStyle(input);
            const mirror = document.createElement("div");
            const trackedStyles = [
                "boxSizing",
                "fontFamily",
                "fontSize",
                "fontWeight",
                "letterSpacing",
                "lineHeight",
                "paddingBottom",
                "paddingLeft",
                "paddingRight",
                "paddingTop",
            ] as const;

            mirror.style.position = "absolute";
            mirror.style.visibility = "hidden";
            mirror.style.overflow = "hidden";
            mirror.style.top = "0";
            mirror.style.left = "-9999px";
            mirror.style.height = `${input.offsetHeight}px`;
            mirror.style.whiteSpace = "pre";
            trackedStyles.forEach((styleName) => {
                mirror.style[styleName] = styles[styleName];
            });

            const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
            const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
            const fontSize = Number.parseFloat(styles.fontSize) || 16;
            const lineHeight = Number.parseFloat(styles.lineHeight) || fontSize * 1.2;
            const contentHeight = input.clientHeight - paddingTop - paddingBottom;
            const top = paddingTop + Math.max((contentHeight - lineHeight) / 2, 0);

            const nextPositions: Record<number, ICursorOverlayPosition> = {};
            document.body.appendChild(mirror);

            remoteCursors.forEach((cursor) => {
                const selectionStart = Math.min(cursor.selectionStart, cursor.selectionEnd);
                const selectionEnd = Math.max(cursor.selectionStart, cursor.selectionEnd);
                const startMarker = createMeasureMarker();
                const endMarker = createMeasureMarker();

                mirror.textContent = value.slice(0, selectionStart);
                mirror.appendChild(startMarker);
                mirror.appendChild(document.createTextNode(value.slice(selectionStart, selectionEnd)));
                mirror.appendChild(endMarker);

                const startLeft = startMarker.offsetLeft - input.scrollLeft;
                const endLeft = endMarker.offsetLeft - input.scrollLeft;
                nextPositions[cursor.clientID] = {
                    caretHeight: lineHeight,
                    caretLeft: endLeft,
                    highlightHeight: lineHeight,
                    highlightLeft: startLeft,
                    highlightWidth: Math.max(endLeft - startLeft, 0),
                    top,
                };
            });

            document.body.removeChild(mirror);
            setCursorPositions(nextPositions);
        }, [remoteCursors, value]);

        return (
            <div className="relative w-full">
                <Input
                    {...props}
                    ref={composeRefs(ref, inputRef)}
                    disabled={disabled}
                    value={value}
                    onChange={handleChange}
                    onClick={handleClick}
                    onFocus={handleFocus}
                    onKeyUp={handleKeyUp}
                    onMouseUp={handleMouseUp}
                    onSelect={handleSelect}
                />
                <RemoteCursors cursors={remoteCursors} positions={cursorPositions} />
            </div>
        );
    }
);

CollaborativeInput.displayName = "Collaborative.Input";

export default CollaborativeInput;

function RemoteCursors({ cursors, positions }: { cursors: ICollaborativeTextCursor[]; positions: Record<number, ICursorOverlayPosition> }) {
    return (
        <>
            {cursors.map((cursor) => {
                const position = positions[cursor.clientID];
                if (!position) {
                    return null;
                }

                return (
                    <React.Fragment key={cursor.clientID}>
                        {cursor.selectionStart !== cursor.selectionEnd && (
                            <span
                                className="pointer-events-none absolute z-[19] rounded-sm opacity-25"
                                style={{
                                    backgroundColor: cursor.color,
                                    height: position.highlightHeight,
                                    left: position.highlightLeft,
                                    top: position.top,
                                    width: position.highlightWidth,
                                }}
                            />
                        )}
                        <span
                            className="pointer-events-none absolute z-[20] w-0.5"
                            style={{
                                backgroundColor: cursor.color,
                                height: position.caretHeight,
                                left: position.caretLeft,
                                top: position.top,
                            }}
                        >
                            <span
                                className="absolute -top-6 left-0 z-[21] whitespace-nowrap rounded px-1.5 py-0.5 text-xs text-white shadow-sm"
                                style={{ backgroundColor: cursor.color }}
                            >
                                {cursor.name}
                            </span>
                        </span>
                    </React.Fragment>
                );
            })}
        </>
    );
}
