/* eslint-disable @typescript-eslint/no-explicit-any */
import { KEYS, getPluginType } from "platejs";

interface IMdxAttribute {
    name: string;
    value?: string;
}

const parseAttributes = (attributes?: IMdxAttribute[]) => {
    if (!attributes || attributes.length === 0) return {} as Record<string, any>;

    return attributes.reduce<Record<string, any>>((acc, attribute) => {
        if (!attribute.name) return acc;

        if (attribute.value === undefined) {
            acc[attribute.name] = true;
            return acc;
        }

        try {
            acc[attribute.name] = JSON.parse(attribute.value);
        } catch {
            acc[attribute.name] = attribute.value;
        }

        return acc;
    }, {});
};

const propsToAttributes = (props: Record<string, unknown>): IMdxAttribute[] => {
    return Object.entries(props)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([name, value]) => ({
            name,
            value: typeof value === "string" ? value : JSON.stringify(value),
        }));
};

const toCaption = (text?: string) => {
    if (!text) return undefined;

    return [{ text }];
};

export const rules = {
    img: {
            deserialize: (mdastNode: any, _: any, options: any) => {
                if (mdastNode.type === "mdxJsxFlowElement" && mdastNode.name === "img") {
                    const { src, alt, title, width: attrWidth, ...rest } = parseAttributes(mdastNode.attributes);

                    let width = typeof attrWidth === "string" ? attrWidth : undefined;
                    let captionText = typeof alt === "string" ? alt : undefined;

                    if (typeof title === "string" && title.length > 0) {
                        try {
                            const payload = JSON.parse(title) as { caption?: string; width?: string };
                            captionText = payload.caption ?? captionText;
                            width = payload.width ?? width;
                        } catch {
                            captionText = title;
                        }
                    }

                    const element: any = {
                        children: [{ text: "" }],
                        type: getPluginType(options.editor!, KEYS.img),
                        url: src,
                        ...rest,
                    };

                    if (captionText) {
                        element.caption = toCaption(captionText);
                    }

                    if (width) {
                        element.width = width;
                    }

                    return element;
                }

                let width: string | undefined;
                let captionText: string | undefined = mdastNode.alt;

                if (typeof mdastNode.title === "string" && mdastNode.title.length > 0) {
                    try {
                        const payload = JSON.parse(mdastNode.title) as { caption?: string; width?: string };
                        captionText = payload.caption ?? captionText;
                        width = payload.width ?? width;
                    } catch {
                        captionText = mdastNode.title;
                    }
                }

                const element: any = {
                    children: [{ text: "" }],
                    type: getPluginType(options.editor!, KEYS.img),
                    url: mdastNode.url,
                };

                if (captionText) {
                    element.caption = toCaption(captionText);
                }

                if (width) {
                    element.width = width;
                }

                return element;
            },
        serialize: (node: any) => {
                const { caption, children, type, url, width, ...rest } = node;
                const captionText = Array.isArray(caption)
                    ? caption.map((c: any) => c?.text ?? "").join("") || undefined
                    : undefined;

                const titlePayload = {} as { caption?: string; width?: string };
                if (captionText) {
                    titlePayload.caption = captionText;
                }
                if (width) {
                    titlePayload.width = width;
                }

                const title = Object.keys(titlePayload).length > 0 ? JSON.stringify(titlePayload) : undefined;

                const attributes = propsToAttributes({
                    alt: captionText,
                    src: url,
                    width,
                    title,
                    ...rest,
                });

                return {
                    attributes,
                    children: [],
                    name: "img",
                    type: "mdxJsxFlowElement",
                };
        },
    },
};
