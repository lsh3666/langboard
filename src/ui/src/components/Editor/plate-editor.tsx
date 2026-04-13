/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Plate } from "platejs/react";
import { TUseCreateEditor, useCreateEditor } from "@/components/Editor/useCreateEditor";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { IEditorContent } from "@/core/models/Base";
import { useCallback, useEffect, useRef } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { EditorDataProvider, TEditorDataProviderProps, useEditorData } from "@/core/providers/EditorDataProvider";
import { TEditor } from "@/components/Editor/editor-kit";
import { useMounted } from "@/core/hooks/useMounted";
import { YjsPlugin } from "@platejs/yjs/react";
import { PlateEditor as TPlateEditor } from "platejs/react";
import { MarkdownPlugin } from "@platejs/markdown";

interface IBasePlateEditorProps extends Omit<TUseCreateEditor, "plugins"> {
    setValue?: (value: IEditorContent) => void;
    variant?: React.ComponentProps<typeof Editor>["variant"];
    className?: string;
    containerClassName?: string;
    editorRef?: React.RefObject<TEditor | null>;
    editorComponentRef?: React.Ref<HTMLDivElement>;
    placeholder?: string;
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
    className,
    containerClassName,
    setValue,
    editorRef,
    editorComponentRef,
    placeholder,
    ...props
}: TPlateEditorProps) {
    if (!editorRef) {
        editorRef = useRef<TEditor>(null);
    }

    const editor = useCreateEditor({
        plugins: [],
        value,
        readOnly,
        ...props,
    } as TUseCreateEditor);
    const mounted = useMounted();
    const { documentID } = useEditorData();
    const convertValue = useCallback(
        (editor: TPlateEditor) => {
            if (value) {
                return editor.getApi(MarkdownPlugin).markdown.deserialize(value.content);
            } else {
                return [];
            }
        },
        [value]
    );

    editorRef.current = editor;

    useEffect(() => {
        if (!mounted || readOnly) {
            return;
        }

        editor.getApi(YjsPlugin).yjs.init({
            id: documentID,
            value: convertValue(editor),
        });

        return () => {
            editor.getApi(YjsPlugin).yjs.destroy();
        };
    }, [editor, readOnly, mounted]);

    return (
        <FocusScope trapped={false} loop={false} className="w-full outline-none">
            <Plate
                editor={editor}
                readOnly={readOnly}
                onValueChange={(opts) => {
                    if (readOnly) {
                        return;
                    }

                    setValue?.({
                        content: opts.editor.api.markdown.serialize(),
                    });
                }}
            >
                <EditorContainer className={containerClassName}>
                    <Editor variant={variant} className={className} placeholder={placeholder} readOnly={readOnly} ref={editorComponentRef} />
                </EditorContainer>
            </Plate>
        </FocusScope>
    );
}
