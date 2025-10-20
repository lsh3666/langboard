/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { TImageElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { useDraggable } from "@platejs/dnd";
import { Image, ImagePlugin, useMediaState } from "@platejs/media/react";
import { ResizableProvider, useResizableValue } from "@platejs/resizable";
import { PlateElement, withHOC, useEditorRef } from "platejs/react";
import { cn } from "@/core/utils/ComponentUtils";
import { Caption, CaptionTextarea } from "@/components/plate-ui/caption";
import { MediaToolbar } from "@/components/plate-ui/media-toolbar";
import { mediaResizeHandleVariants, Resizable, ResizeHandle } from "@/components/plate-ui/resize-handle";
import { useTranslation } from "react-i18next";
import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toCssWidth } from "@/components/plate-ui/utils";

const SMALL_IMAGE_MAX_WIDTH = 400;

export const ImageElement = withHOC(ResizableProvider, function ImageElement(props: PlateElementProps<TImageElement>) {
    const { t } = useTranslation();
    const { align = "center", focused, readOnly, selected } = useMediaState();
    const width = useResizableValue("width");
    const editor = useEditorRef();
    const [pendingWidth, setPendingWidth] = useState<number | undefined>();
    const hasAppliedInitialWidthRef = useRef<boolean>(Boolean(props.element.width));

    useEffect(() => {
        if (props.element.width) {
            hasAppliedInitialWidthRef.current = true;
            setPendingWidth(undefined);
        } else {
            hasAppliedInitialWidthRef.current = false;
        }
    }, [props.element.width]);

    const handleImageLoad = useCallback(
        (event: SyntheticEvent<HTMLImageElement>) => {
            if (props.element.width || (hasAppliedInitialWidthRef.current && !readOnly)) {
                return;
            }

            const naturalWidth = event.currentTarget.naturalWidth;

            if (!naturalWidth) return;

            if (naturalWidth <= SMALL_IMAGE_MAX_WIDTH) {
                const widthValue = Math.round(naturalWidth);
                setPendingWidth(widthValue);

                if (!readOnly) {
                    const path = editor.api.findPath(props.element);

                    if (path) {
                        editor.tf.setNodes({ width: `${widthValue}px` }, { at: path });
                        hasAppliedInitialWidthRef.current = true;
                    }
                }
            } else {
                setPendingWidth(undefined);
            }
        },
        [editor, props.element, readOnly]
    );

    const { isDragging, handleRef } = useDraggable({
        element: props.element,
    });

    const elementWidth = useMemo(() => toCssWidth(props.element.width), [props.element.width]);
    const resizableWidth = useMemo(() => toCssWidth(width), [width]);
    const pendingCssWidth = useMemo(() => toCssWidth(pendingWidth), [pendingWidth]);
    const displayWidth = elementWidth ?? pendingCssWidth;
    const figureWidth = displayWidth ?? resizableWidth;
    const imageWidth = displayWidth ?? "100%";
    const figureStyle = useMemo(() => (figureWidth ? { width: figureWidth } : undefined), [figureWidth]);

    return (
        <MediaToolbar plugin={ImagePlugin}>
            <PlateElement {...props} className="py-2.5">
                <figure className="group relative m-0" contentEditable={false} style={figureStyle}>
                    <Resizable
                        align={align}
                        style={figureStyle}
                        options={{
                            align,
                            readOnly,
                        }}
                    >
                        <ResizeHandle className={mediaResizeHandleVariants({ direction: "left" })} options={{ direction: "left" }} />
                        <Image
                            ref={handleRef}
                            className={cn(
                                "block max-w-full cursor-pointer object-cover px-0",
                                "rounded-sm",
                                focused && selected && "ring-2 ring-ring ring-offset-2",
                                isDragging && "opacity-50"
                            )}
                            alt={(props.element as any)?.alt ?? ""}
                            style={{ width: imageWidth }}
                            onLoad={handleImageLoad}
                        />
                        <ResizeHandle
                            className={mediaResizeHandleVariants({
                                direction: "right",
                            })}
                            options={{ direction: "right" }}
                        />
                    </Resizable>

                    <Caption style={figureStyle} align={align}>
                        <CaptionTextarea
                            readOnly={readOnly}
                            onFocus={(e) => {
                                e.preventDefault();
                            }}
                            placeholder={t("editor.Write a caption...")}
                        />
                    </Caption>
                </figure>

                {props.children}
            </PlateElement>
        </MediaToolbar>
    );
});
