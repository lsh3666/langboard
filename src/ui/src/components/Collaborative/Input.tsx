import Input, { InputProps } from "@/components/base/Input";
import { ICollaborativeTextCursor, useCollaborativeText } from "@/components/Collaborative/useCollaborativeText";
import { composeRefs } from "@/core/utils/ComponentUtils";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";

export interface ICollaborativeInputProps extends Omit<InputProps, "value" | "onChange"> {
    documentID: string;
    field: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onValueChange?: (value: string) => void;
}

const CollaborativeInput = React.forwardRef<HTMLInputElement, ICollaborativeInputProps>(
    ({ documentID, field, defaultValue, disabled, onChange, onSelect, onKeyUp, onClick, onFocus, onValueChange, ...props }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const { remoteCursors, updateSelection, value, updateValue } = useCollaborativeText({
            documentID,
            field,
            defaultValue,
            disabled,
        });

        const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
            updateValue(event.target.value);
            updateSelection(event.target.selectionStart ?? 0, event.target.selectionEnd ?? event.target.selectionStart ?? 0);
            onChange?.(event);
        };

        const updateLocalSelection = useCallback(() => {
            const input = inputRef.current;
            if (!input) {
                return;
            }

            updateSelection(input.selectionStart ?? 0, input.selectionEnd ?? input.selectionStart ?? 0);
        }, [updateSelection]);

        const [cursorPositions, setCursorPositions] = useState<Record<number, { left: number; top: number }>>({});

        useLayoutEffect(() => {
            onValueChange?.(value);
        }, [onValueChange, value]);

        useLayoutEffect(() => {
            const input = inputRef.current;
            if (!input || !remoteCursors.length) {
                setCursorPositions({});
                return;
            }

            const styles = window.getComputedStyle(input);
            const mirror = document.createElement("div");
            const trackedStyles = ["boxSizing", "fontFamily", "fontSize", "fontWeight", "letterSpacing", "paddingLeft", "paddingRight"] as const;

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

            const nextPositions: Record<number, { left: number; top: number }> = {};
            document.body.appendChild(mirror);

            remoteCursors.forEach((cursor) => {
                mirror.textContent = value.slice(0, cursor.selectionEnd);
                const marker = document.createElement("span");
                marker.textContent = value.slice(cursor.selectionEnd, cursor.selectionEnd + 1) || ".";
                mirror.appendChild(marker);

                nextPositions[cursor.clientID] = {
                    left: marker.offsetLeft - input.scrollLeft,
                    top: 7,
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
                    onClick={(event) => {
                        updateLocalSelection();
                        onClick?.(event);
                    }}
                    onFocus={(event) => {
                        updateLocalSelection();
                        onFocus?.(event);
                    }}
                    onKeyUp={(event) => {
                        updateLocalSelection();
                        onKeyUp?.(event);
                    }}
                    onSelect={(event) => {
                        updateLocalSelection();
                        onSelect?.(event);
                    }}
                />
                <RemoteCursors cursors={remoteCursors} positions={cursorPositions} />
            </div>
        );
    }
);

CollaborativeInput.displayName = "Collaborative.Input";

export default CollaborativeInput;

function RemoteCursors({ cursors, positions }: { cursors: ICollaborativeTextCursor[]; positions: Record<number, { left: number; top: number }> }) {
    return (
        <>
            {cursors.map((cursor) => {
                const position = positions[cursor.clientID];
                if (!position) {
                    return null;
                }

                return (
                    <span
                        key={cursor.clientID}
                        className="pointer-events-none absolute z-10 h-5 w-0.5"
                        style={{
                            backgroundColor: cursor.color,
                            left: position.left,
                            top: position.top,
                        }}
                    >
                        <span
                            className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-xs text-white"
                            style={{ backgroundColor: cursor.color }}
                        >
                            {cursor.name}
                        </span>
                    </span>
                );
            })}
        </>
    );
}
