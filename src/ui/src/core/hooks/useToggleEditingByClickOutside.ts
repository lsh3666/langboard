import { Utils } from "@langboard/core/utils";
import { useCallback, useRef } from "react";

const DRAG_THRESHOLD_PX = 6;

const hasSelectionInsideBox = (box: Element | null) => {
    if (!box) {
        return false;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return false;
    }

    const { anchorNode, focusNode } = selection;
    return !!anchorNode && !!focusNode && box.contains(anchorNode) && box.contains(focusNode);
};

const useToggleEditingByClickOutside = (boxAttr: string, changeMode: (mode: "edit" | "view") => void, isEditing?: bool) => {
    const isDraggingRef = useRef(false);
    const startEditing = useCallback(
        (event: React.PointerEvent | PointerEvent | React.MouseEvent | MouseEvent | CustomEvent) => {
            const target = event.target as HTMLElement;
            const box = target.closest(boxAttr);
            if (
                isEditing ||
                !box ||
                target.closest("a") ||
                target.closest("video") ||
                target.closest("embed") ||
                target.closest("audio") ||
                target.closest("img") ||
                target.closest(".slate-file") ||
                target.closest("[data-reply-component") ||
                target.closest(".internal-link")
            ) {
                return;
            }

            if ("button" in event && event.button !== 0) {
                return;
            }

            const startX = "clientX" in event ? event.clientX : 0;
            const startY = "clientY" in event ? event.clientY : 0;

            const onMove = (moveEvent: PointerEvent) => {
                if (Math.abs(moveEvent.clientX - startX) > DRAG_THRESHOLD_PX || Math.abs(moveEvent.clientY - startY) > DRAG_THRESHOLD_PX) {
                    isDraggingRef.current = true;
                }
            };

            const cleanup = () => {
                document.removeEventListener("pointermove", onMove);
                document.removeEventListener("pointerup", onEnd);
                document.removeEventListener("pointercancel", onCancel);
            };

            const onEnd = () => {
                cleanup();

                if (isDraggingRef.current || hasSelectionInsideBox(box)) {
                    isDraggingRef.current = false;
                    return;
                }

                changeMode("edit");
            };

            const onCancel = () => {
                cleanup();
                isDraggingRef.current = false;
            };

            isDraggingRef.current = false;
            document.addEventListener("pointermove", onMove);
            document.addEventListener("pointerup", onEnd);
            document.addEventListener("pointercancel", onCancel);
        },
        [changeMode, isEditing]
    );
    const stopEditing = useCallback(
        (event: React.MouseEvent | CustomEvent | MouseEvent) => {
            const ignoreUntil = (window as Window & { __lbIgnoreStopEditingUntil?: number }).__lbIgnoreStopEditingUntil ?? 0;
            if (ignoreUntil > Date.now()) {
                return;
            }

            const target = event.target as HTMLElement;
            if (
                (Utils.Type.isBool(isEditing) && !isEditing) ||
                target.hasAttribute("data-scroll-area-scrollbar") ||
                target.closest("[data-scroll-area-scrollbar]") ||
                target.closest("[data-sonner-toast]") ||
                target.closest(boxAttr) ||
                target.closest("[data-plate-combobox-content]") || // Editor's combobox
                target.closest("[data-radix-popper-content-wrapper]") || // Editor's dropdown menu
                target.closest("[data-radix-alert-dialog-content-wrapper]") || // Editor's alert dialog
                target.closest("[data-dialog-overlay]") ||
                target.closest("[data-reply-component")
            ) {
                return;
            }

            changeMode("view");
        },
        [changeMode, isEditing]
    );

    return { startEditing, stopEditing };
};

export default useToggleEditingByClickOutside;
