/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSocket } from "@/core/providers/SocketProvider";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { IEditorContent } from "@/core/models/Base";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createCopilotKit } from "@/components/Editor/plugins/copilot-kit";
import { createAiKit } from "@/components/Editor/plugins/ai-kit";
import { PlateEditor, PlatePlugin, usePlateEditor } from "platejs/react";
import { type Value } from "platejs";
import { MarkdownPlugin } from "@platejs/markdown";
import { EditorKit } from "@/components/Editor/editor-kit";
import { DndKit } from "@/components/Editor/plugins/dnd-kit";
import { createYjsKit } from "@/components/Editor/plugins/yjs-kit";

const EMPTY_PLUGINS: PlatePlugin<any>[] = [];

interface IBaseUseCreateEditor {
    plugins?: PlatePlugin<any>[];
    value?: IEditorContent;
    readOnly?: bool;
    deserializedValue?: Value;
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
    const { value, readOnly = false, plugins: customPlugins, deserializedValue } = props;
    const { currentUser, socketEvents, chatEventKey, copilotEventKey, form, documentID } = useEditorData();
    const firstname = currentUser.useField("firstname");
    const lastname = currentUser.useField("lastname");
    const fullName = useMemo(() => `${firstname} ${lastname}`, [firstname, lastname]);
    const valueRef = useRef(value);
    const deserializedValueRef = useRef(deserializedValue);
    const formRef = useRef(form);
    valueRef.current = value;
    deserializedValueRef.current = deserializedValue;
    formRef.current = form;

    const plugins = useMemo(() => {
        const pluginList = [...EditorKit, ...(customPlugins ?? EMPTY_PLUGINS)];
        if (!readOnly && socketEvents) {
            const { chatEvents, copilotEvents } = socketEvents;
            pluginList.push(
                ...DndKit,
                ...createAiKit({ socket, eventKey: chatEventKey!, events: chatEvents, commonEventData: formRef.current }),
                ...createCopilotKit({
                    socket,
                    eventKey: copilotEventKey!,
                    events: copilotEvents,
                    commonEventData: formRef.current,
                })
            );

            if (documentID) {
                const yjsKit = createYjsKit({ socket, userName: fullName, documentID });
                if (yjsKit) {
                    pluginList.push(yjsKit);
                }
            }
        }
        return pluginList;
    }, [readOnly, socketEvents, chatEventKey, copilotEventKey, documentID, fullName, customPlugins]);
    const getEditorValue = useCallback((editor: PlateEditor) => {
        if (deserializedValueRef.current) {
            return deserializedValueRef.current;
        }

        if (valueRef.current) {
            return editor.getApi(MarkdownPlugin).markdown.deserialize(valueRef.current.content);
        } else {
            return [];
        }
    }, []);
    const editor = usePlateEditor(
        {
            plugins,
            value: getEditorValue,
            autoSelect: false,
        },
        [readOnly, plugins]
    );

    useEffect(() => {
        if (!readOnly) {
            return;
        }

        editor.tf.setValue(getEditorValue(editor));
    }, [deserializedValue, editor, getEditorValue, readOnly, value]);

    return editor;
};
