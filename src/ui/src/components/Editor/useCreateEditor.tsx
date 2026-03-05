/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSocket } from "@/core/providers/SocketProvider";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { IEditorContent } from "@/core/models/Base";
import { useCallback, useEffect, useMemo } from "react";
import { createCopilotKit } from "@/components/Editor/plugins/copilot-kit";
import { createAiKit } from "@/components/Editor/plugins/ai-kit";
import { PlateEditor, PlatePlugin, usePlateEditor } from "platejs/react";
import { MarkdownPlugin } from "@platejs/markdown";
import { EditorKit } from "@/components/Editor/editor-kit";
import { DndKit } from "@/components/Editor/plugins/dnd-kit";

interface IBaseUseCreateEditor {
    plugins?: PlatePlugin<any>[];
    value?: IEditorContent;
    readOnly?: bool;
}

export interface IUseReadonlyEditor extends IBaseUseCreateEditor {
    readOnly: true;
    value: IEditorContent;
}

export interface IUseEditor extends IBaseUseCreateEditor {
    readOnly?: false;
    value?: IEditorContent;
}

export type TUseCreateEditor = IUseReadonlyEditor | IUseEditor;

export const useCreateEditor = (props: TUseCreateEditor) => {
    const socket = useSocket();
    const { value, readOnly = false, plugins: customPlugins } = props;
    const { socketEvents, chatEventKey, copilotEventKey, form } = useEditorData();

    const plugins = useMemo(() => {
        const pluginList = [...EditorKit, ...(customPlugins ?? [])];
        if (!readOnly && socketEvents) {
            const { chatEvents, copilotEvents } = socketEvents;
            pluginList.push(
                ...DndKit,
                ...createAiKit({ socket, eventKey: chatEventKey!, events: chatEvents, commonEventData: form }),
                ...createCopilotKit({
                    socket,
                    eventKey: copilotEventKey!,
                    events: copilotEvents,
                    commonEventData: form,
                })
            );
        }
        return pluginList;
    }, [readOnly, socketEvents, chatEventKey, copilotEventKey, form]);
    const convertValue = useCallback(
        (editor: PlateEditor) => {
            if (value) {
                return editor.getApi(MarkdownPlugin).markdown.deserialize(value.content);
            } else {
                return [];
            }
        },
        [value]
    );
    const editor = usePlateEditor(
        {
            plugins,
            value: convertValue,
            autoSelect: "end",
        },
        [readOnly, plugins, convertValue]
    );

    useEffect(() => {
        if (!readOnly) {
            return;
        }

        editor.tf.setValue(convertValue(editor));
    }, [value]);

    return editor;
};
