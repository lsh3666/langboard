/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Plate } from "platejs/react";
import { TUseCreateEditor, useCreateEditor } from "@/components/Editor/useCreateEditor";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { IEditorContent } from "@/core/models/Base";
import { useCallback, useEffect, useRef } from "react";
import { type Value } from "platejs";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { EditorDataProvider, TEditorDataProviderProps, useEditorData } from "@/core/providers/EditorDataProvider";
import { TEditor } from "@/components/Editor/editor-kit";
import { useMounted } from "@/core/hooks/useMounted";
import { YjsPlugin } from "@platejs/yjs/react";
import { PlateEditor as TPlateEditor } from "platejs/react";
import { MarkdownPlugin } from "@platejs/markdown";

interface IBasePlateEditorProps extends Omit<TUseCreateEditor, "plugins"> {
    setValue?: (value: IEditorContent) => void;
    onEditorChange?: (editor: TEditor) => void;
    serializeOnChange?: bool;
    focusOnReady?: bool;
    variant?: React.ComponentProps<typeof Editor>["variant"];
    className?: string;
    containerClassName?: string;
    editorRef?: React.RefObject<TEditor | null>;
    editorComponentRef?: React.Ref<HTMLDivElement>;
    placeholder?: string;
    deserializedValue?: Value;
}

interface IPlateViewerProps extends IBasePlateEditorProps {
    setValue?: never;
    readOnly: true;
}

interface IPlateEditorProps extends IBasePlateEditorProps {
    setValue: (value: IEditorContent) => void;
    readOnly?: bool;
}

export type TPlateEditorProps = IPlateViewerProps | IPlateEditorProps;

export function PlateEditor(props: TPlateEditorProps & Omit<TEditorDataProviderProps, "children">) {
    return (
        <EditorDataProvider {...(props as any)}>
            <EditorWrapper {...props} />
        </EditorDataProvider>
    );
}

function EditorWrapper({
    value,
    readOnly,
    variant = "ai",
    serializeOnChange = true,
    focusOnReady = false,
    className,
    containerClassName,
    setValue,
    onEditorChange,
    editorRef,
    editorComponentRef,
    placeholder,
    deserializedValue,
    ...props
}: TPlateEditorProps) {
    if (!editorRef) {
        editorRef = useRef<TEditor>(null);
    }

    const internalEditorComponentRef = useRef<HTMLDivElement>(null);
    const editor = useCreateEditor({
        value,
        readOnly,
        deserializedValue,
        ...props,
    } as TUseCreateEditor);
    const mounted = useMounted();
    const { documentID } = useEditorData();
    const valueRef = useRef(value);
    const deserializedValueRef = useRef(deserializedValue);
    valueRef.current = value;
    deserializedValueRef.current = deserializedValue;
    const focusEditor = useCallback(() => {
        if (!focusOnReady || readOnly) {
            return;
        }

        const focusElement = internalEditorComponentRef.current;
        if (!focusElement) {
            return;
        }

        window.setTimeout(() => {
            try {
                editor.tf.focus({ edge: "endEditor", retries: 3 });
            } catch (e) {
                console.log(e);
                focusElement.focus();
            }
        }, 0);
    }, [editor, focusOnReady, readOnly]);
    const getEditorValue = useCallback((editor: TPlateEditor) => {
        if (deserializedValueRef.current) {
            return deserializedValueRef.current;
        }

        if (valueRef.current) {
            return editor.getApi(MarkdownPlugin).markdown.deserialize(valueRef.current.content);
        } else {
            return [];
        }
    }, []);

    const handleValueChange = useCallback(
        (opts: { editor: TPlateEditor }) => {
            if (readOnly) {
                return;
            }

            onEditorChange?.(opts.editor as TEditor);

            if (!serializeOnChange) {
                return;
            }

            const nextContent = opts.editor.getApi(MarkdownPlugin).markdown.serialize();
            if (nextContent === valueRef.current?.content) {
                return;
            }

            setValue?.({
                content: nextContent,
            });
        },
        [onEditorChange, readOnly, serializeOnChange, setValue]
    );

    editorRef.current = editor;

    useEffect(() => {
        if (!mounted || readOnly || !documentID) {
            return;
        }

        const yjsApi = editor.getApi(YjsPlugin)?.yjs;
        if (!yjsApi) {
            return;
        }

        yjsApi.init({
            id: documentID,
            value: getEditorValue(editor),
            onReady: focusEditor,
        });

        return () => {
            yjsApi.destroy();
        };
    }, [documentID, editor, focusEditor, getEditorValue, mounted, readOnly]);

    useEffect(() => {
        if (!mounted || readOnly || !focusOnReady || documentID) {
            return;
        }

        focusEditor();
    }, [documentID, focusEditor, focusOnReady, mounted, readOnly]);

    const setEditorComponentRefs = useCallback(
        (node: HTMLDivElement | null) => {
            internalEditorComponentRef.current = node;

            if (!editorComponentRef) {
                return;
            }

            if (typeof editorComponentRef === "function") {
                editorComponentRef(node);
                return;
            }

            editorComponentRef.current = node;
        },
        [editorComponentRef]
    );

    return (
        <FocusScope trapped={false} loop={false} className="w-full outline-none">
            <Plate editor={editor} readOnly={readOnly} onValueChange={handleValueChange}>
                <EditorContainer className={containerClassName}>
                    <Editor variant={variant} className={className} placeholder={placeholder} readOnly={readOnly} ref={setEditorComponentRefs} />
                </EditorContainer>
            </Plate>
        </FocusScope>
    );
}
