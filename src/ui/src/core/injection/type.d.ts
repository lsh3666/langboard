import { Duration } from "date-fns";
import { TFunction, i18n } from "i18next";
import type { IUtils } from "@langboard/core/utils";

type THTMLTags = keyof HTMLElementTagNameMap;

export declare module "@langboard/core/utils" {
    const Utils: IUtils & {
        readonly String: {
            formatDateLocale: (date: Date) => string;
            formatDateDistance: (i18n: i18n, translate: TFunction<"translation", undefined>, date: Date) => string;
            formatTimerDuration: (duration: Duration) => string;
            convertServerFileURL: {
                <TURL extends string | undefined>(url: TURL): TURL extends string ? string : undefined;
            };
            isValidURL: (str: unknown) => bool;
        };
        readonly Type: {
            isWindow: (value: unknown) => value is Window & typeof globalThis;
            isNode: (value: unknown) => value is Node;
            isElement: {
                <TName extends THTMLTags | undefined>(
                    value: unknown,
                    tag?: TName
                ): value is TName extends THTMLTags ? HTMLElementTagNameMap[TName] : Element;
            };
            isAttribute: (value: unknown) => value is Attr;
            isText: (value: unknown) => value is Text;
            isCDATASection: (value: unknown) => value is CDATASection;
            isEntityReference: (value: unknown) => value is Node;
            isEntity: (value: unknown) => value is Node;
            isProcessingInstruction: (value: unknown) => value is ProcessingInstruction;
            isComment: (value: unknown) => value is Comment;
            isDocument: (value: unknown) => value is Document;
            isDocumentType: (value: unknown) => value is DocumentType;
            isDocumentFragment: (value: unknown) => value is DocumentFragment;
            isNotation: (value: unknown) => value is Node;
        };
    };
}
