/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Plate } from "platejs/react";
import { TUseCreateEditor, useCreateEditor } from "@/components/Editor/useCreateEditor";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { IEditorContent } from "@/core/models/Base";
import { useRef } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { EditorDataProvider, TEditorDataProviderProps } from "@/core/providers/EditorDataProvider";
import { TEditor } from "@/components/Editor/editor-kit";

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

    editorRef.current = editor;

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
