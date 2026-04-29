import Textarea, { TextareaProps } from "@/components/base/Textarea";
import { ICollaborativeTextCursor, useCollaborativeText } from "@/components/Collaborative/useCollaborativeText";
import { cn, composeRefs } from "@/core/utils/ComponentUtils";
import { TEditorCollaborationType } from "@langboard/core/constants";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ICollaborativeTextareaProps extends Omit<TextareaProps, "value" | "onChange"> {
    collaborationType?: TEditorCollaborationType;
    documentID?: string;
    field: string;
    section?: number | string;
    uid?: number | string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onValueChange?: (value: string) => void;
}

interface IHighlightRect {
    height: number;
    left: number;
    top: number;
    width: number;
}

interface ICursorOverlayPosition {
    caretHeight: number;
    caretLeft: number;
    caretTop: number;
    highlightRects: IHighlightRect[];
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

const getPxValue = (value: string, fallback: number = 0) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const CollaborativeTextarea = React.forwardRef<HTMLTextAreaElement, ICollaborativeTextareaProps>(
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
            className,
            ...props
        },
        ref
    ) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null);
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

        const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
            updateValue(event.target.value);
            updateSelection(event.target.selectionStart, event.target.selectionEnd);
            onChange?.(event);
        };

        const handleClick: React.MouseEventHandler<HTMLTextAreaElement> = (event) => {
            updateLocalSelection();
            onClick?.(event);
        };

        const handleFocus: React.FocusEventHandler<HTMLTextAreaElement> = (event) => {
            updateLocalSelection();
            onFocus?.(event);
        };

        const handleKeyUp: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
            updateLocalSelection();
            onKeyUp?.(event);
        };

        const handleSelect: React.ReactEventHandler<HTMLTextAreaElement> = (event) => {
            updateLocalSelection();
            onSelect?.(event);
        };

        const handleMouseUp: React.MouseEventHandler<HTMLTextAreaElement> = (event) => {
            updateLocalSelection();
            onMouseUp?.(event);
        };

        const updateLocalSelection = useCallback(() => {
            const textarea = textareaRef.current;
            if (!textarea) {
                return;
            }

            updateSelection(textarea.selectionStart, textarea.selectionEnd);
        }, [updateSelection]);

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

            const paddingLeft = getPxValue(styles.paddingLeft);
            const paddingRight = getPxValue(styles.paddingRight);
            const lineHeight = getPxValue(styles.lineHeight, getPxValue(styles.fontSize, 16) * 1.2);
            const innerRight = textarea.clientWidth - paddingRight;
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

                const startLeft = startMarker.offsetLeft - textarea.scrollLeft;
                const startTop = startMarker.offsetTop - textarea.scrollTop;
                const endLeft = endMarker.offsetLeft - textarea.scrollLeft;
                const endTop = endMarker.offsetTop - textarea.scrollTop;
                const highlightRects: IHighlightRect[] = [];

                if (selectionStart !== selectionEnd) {
                    if (startTop === endTop) {
                        highlightRects.push({
                            height: lineHeight,
                            left: startLeft,
                            top: startTop,
                            width: Math.max(endLeft - startLeft, 0),
                        });
                    } else {
                        highlightRects.push({
                            height: lineHeight,
                            left: startLeft,
                            top: startTop,
                            width: Math.max(innerRight - startLeft, 0),
                        });

                        for (let top = startTop + lineHeight; top < endTop; top += lineHeight) {
                            highlightRects.push({
                                height: lineHeight,
                                left: paddingLeft,
                                top,
                                width: Math.max(innerRight - paddingLeft, 0),
                            });
                        }

                        highlightRects.push({
                            height: lineHeight,
                            left: paddingLeft,
                            top: endTop,
                            width: Math.max(endLeft - paddingLeft, 0),
                        });
                    }
                }

                nextPositions[cursor.clientID] = {
                    caretHeight: lineHeight,
                    caretLeft: endLeft,
                    caretTop: endTop,
                    highlightRects,
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

CollaborativeTextarea.displayName = "Collaborative.Textarea";

export default CollaborativeTextarea;

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
                        {position.highlightRects.map((rect, index) => (
                            <span
                                key={`${cursor.clientID}-${index}`}
                                className="pointer-events-none absolute z-[19] rounded-sm opacity-25"
                                style={{
                                    backgroundColor: cursor.color,
                                    height: rect.height,
                                    left: rect.left,
                                    top: rect.top,
                                    width: rect.width,
                                }}
                            />
                        ))}
                        <span
                            className={cn(
                                "pointer-events-none absolute z-[20] w-0.5",
                                "after:absolute after:left-0 after:top-0 after:whitespace-nowrap"
                            )}
                            style={{
                                backgroundColor: cursor.color,
                                height: position.caretHeight,
                                left: position.caretLeft,
                                top: position.caretTop,
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
