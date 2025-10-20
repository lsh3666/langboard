/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SlateElementProps, TCaptionProps, TImageElement, TResizableProps } from "platejs";
import { NodeApi, SlateElement } from "platejs";
import { cn } from "@/core/utils/ComponentUtils";
import CachedImage from "@/components/CachedImage";
import { toCssWidth } from "@/components/plate-ui/utils";

export function ImageElementStatic(props: SlateElementProps<TImageElement & TCaptionProps & TResizableProps>) {
    const { align = "center", caption, url, width } = props.element;
    const elementWidth = toCssWidth(width);
    const figureStyle = elementWidth ? { width: elementWidth } : undefined;
    const imageWidth = elementWidth ?? "100%";

    return (
        <SlateElement {...props} className="py-2.5">
            <figure className="group relative m-0 inline-block" style={figureStyle}>
                <div className="relative min-w-[92px] max-w-full" style={{ textAlign: align }}>
                    <CachedImage
                        className={cn("w-full max-w-full cursor-default object-cover px-0", "rounded-sm")}
                        alt={(props.attributes as any).alt}
                        style={{ width: imageWidth }}
                        src={url}
                    />
                    {caption && <figcaption className="mx-auto mt-2 h-[24px] max-w-full">{NodeApi.string(caption[0])}</figcaption>}
                </div>
            </figure>
            {props.children}
        </SlateElement>
    );
}
