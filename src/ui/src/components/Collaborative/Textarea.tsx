import Textarea, { TextareaProps } from "@/components/base/Textarea";
import { ICollaborativeTextCursor, useCollaborativeText } from "@/components/Collaborative/useCollaborativeText";
import { cn, composeRefs } from "@/core/utils/ComponentUtils";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ICollaborativeTextareaProps extends Omit<TextareaProps, "value" | "onChange"> {
    documentID: string;
    field: string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onValueChange?: (value: string) => void;
}

const CollaborativeTextarea = React.forwardRef<HTMLTextAreaElement, ICollaborativeTextareaProps>(
    ({ documentID, field, defaultValue, disabled, onChange, onSelect, onKeyUp, onClick, onFocus, onValueChange, className, ...props }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const { remoteCursors, updateSelection, value, updateValue } = useCollaborativeText({
            documentID,
            field,
            defaultValue,
            disabled,
        });
        const [cursorPositions, setCursorPositions] = useState<Record<number, { left: number; top: number }>>({});

        const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
            updateValue(event.target.value);
            updateSelection(event.target.selectionStart, event.target.selectionEnd);
            onChange?.(event);
        };

        const updateLocalSelection = useCallback(() => {
            const textarea = textareaRef.current;
            if (!textarea) {
                return;
            }

            updateSelection(textarea.selectionStart, textarea.selectionEnd);
        }, [updateSelection]);

        useLayoutEffect(() => {
            onValueChange?.(value);
        }, [onValueChange, value]);

        useEffect(() => {
            updateLocalSelection();
        }, [updateLocalSelection]);

        useLayoutEffect(() => {
            const textarea = textareaRef.current;
            if (!textarea || !remoteCursors.length) {
                setCursorPositions({});
                return;
            }

            const styles = window.getComputedStyle(textarea);
            const mirror = document.createElement("div");
            const trackedStyles = [
                "boxSizing",
                "borderBottomWidth",
                "borderLeftWidth",
                "borderRightWidth",
                "borderTopWidth",
                "fontFamily",
                "fontSize",
                "fontWeight",
                "letterSpacing",
                "lineHeight",
                "paddingBottom",
                "paddingLeft",
                "paddingRight",
                "paddingTop",
                "textTransform",
                "whiteSpace",
                "wordBreak",
                "wordSpacing",
                "wordWrap",
            ] as const;

            mirror.style.position = "absolute";
            mirror.style.visibility = "hidden";
            mirror.style.overflow = "hidden";
            mirror.style.top = "0";
            mirror.style.left = "-9999px";
            mirror.style.width = `${textarea.offsetWidth}px`;
            mirror.style.whiteSpace = "pre-wrap";
            mirror.style.wordWrap = "break-word";
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
                    left: marker.offsetLeft - textarea.scrollLeft,
                    top: marker.offsetTop - textarea.scrollTop,
                };
            });

            document.body.removeChild(mirror);
            setCursorPositions(nextPositions);
        }, [remoteCursors, value]);

        return (
            <div className="relative w-full">
                <Textarea
                    {...props}
                    ref={composeRefs(ref, textareaRef)}
                    disabled={disabled}
                    value={value}
                    className={className}
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

CollaborativeTextarea.displayName = "Collaborative.Textarea";

export default CollaborativeTextarea;

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
                        className={cn(
                            "pointer-events-none absolute z-10 h-5 w-0.5",
                            "after:absolute after:left-0 after:top-0 after:whitespace-nowrap"
                        )}
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
