import { Utils } from "@langboard/core/utils";
import { useCallback, useRef } from "react";

const useToggleEditingByClickOutside = (boxAttr: string, changeMode: (mode: "edit" | "view") => void, isEditing?: bool) => {
    const isDraggingRef = useRef(false);
    const draggingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const startEditing = useCallback(
        (event: React.MouseEvent | CustomEvent | MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                isEditing ||
                !target.closest(boxAttr) ||
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

            const onEnd = () => {
                document.removeEventListener("pointerup", onEnd);

                if (isDraggingRef.current) {
                    isDraggingRef.current = false;
                    if (draggingTimeoutRef.current) {
                        clearTimeout(draggingTimeoutRef.current);
                        draggingTimeoutRef.current = null;
                    }
                    return;
                }

                changeMode("edit");
            };

            document.addEventListener("pointerup", onEnd);

            isDraggingRef.current = false;
            draggingTimeoutRef.current = setTimeout(() => {
                isDraggingRef.current = true;
                if (draggingTimeoutRef.current) {
                    clearTimeout(draggingTimeoutRef.current);
                    draggingTimeoutRef.current = null;
                }
            }, 100);
        },
        [changeMode, isEditing]
    );
    const stopEditing = useCallback(
        (event: React.MouseEvent | CustomEvent | MouseEvent) => {
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
