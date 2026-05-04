import { useAuth } from "@/core/providers/AuthProvider";
import { useSocket } from "@/core/providers/SocketProvider";
import { TEditorCollaborationType } from "@langboard/core/constants";
import { Utils } from "@langboard/core/utils";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

export interface IUseCollaborativeTextProps {
    collaborationType?: TEditorCollaborationType;
    documentID?: string;
    field: string;
    section?: number | string;
    uid?: number | string;
    defaultValue?: string | number | readonly string[];
    disabled?: bool;
    onValueChange?: (value: string) => void;
}

export interface ICollaborativeTextCursor {
    clientID: number;
    color: string;
    name: string;
    selectionEnd: number;
    selectionStart: number;
}

export interface ICollaborativeTextMeta<TValue = unknown> {
    clientID: number;
    color: string;
    name: string;
    userID?: string;
    value: TValue;
}

interface IAwarenessTextSelection {
    color: string;
    field: string;
    name: string;
    selectionEnd: number;
    selectionStart: number;
    userID?: string;
}

interface IAwarenessTextMeta<TValue = unknown> {
    color: string;
    field: string;
    name: string;
    userID?: string;
    value: TValue;
}

const normalizeValue = (value: IUseCollaborativeTextProps["defaultValue"]) => {
    if (Array.isArray(value)) {
        return value.join("");
    }

    return value?.toString() ?? "";
};

export const useCollaborativeText = ({
    collaborationType,
    documentID,
    field,
    section,
    uid,
    defaultValue,
    disabled,
    onValueChange,
}: IUseCollaborativeTextProps) => {
    const socket = useSocket();
    const { currentUser } = useAuth();
    const currentUserUID = currentUser?.uid ?? "";
    const resolvedDocumentID = useMemo(() => {
        if (documentID) {
            return documentID;
        }

        if (!collaborationType || uid === undefined || uid === null) {
            return "";
        }

        return Utils.String.createEditorCollaborationDocumentID({ collaborationType, uid, section });
    }, [collaborationType, documentID, section, uid]);
    const fallbackValue = useMemo(() => normalizeValue(defaultValue), [defaultValue]);
    const fallbackValueRef = useRef(fallbackValue);
    const onValueChangeRef = useRef(onValueChange);
    const userName = useMemo(() => {
        if (!currentUser) {
            return "";
        }

        return `${currentUser.firstname} ${currentUser.lastname}`.trim() || currentUser.username;
    }, [currentUser]);
    const userColor = useMemo(() => new Utils.Color.Generator(userName || "Anonymous").generateRandomColor(), [userName]);
    const [value, setValue] = useState(fallbackValue);
    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [remoteCursors, setRemoteCursors] = useState<ICollaborativeTextCursor[]>([]);
    const [remoteMeta, setRemoteMeta] = useState<ICollaborativeTextMeta[]>([]);
    const providerRef = useRef<HocuspocusProvider | null>(null);
    const ytextRef = useRef<Y.Text | null>(null);
    const isApplyingRemoteChangeRef = useRef(false);
    const valueRef = useRef(fallbackValue);

    useEffect(() => {
        fallbackValueRef.current = fallbackValue;
    }, [fallbackValue]);

    useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    useEffect(() => {
        let disposed = false;

        if (disabled || !resolvedDocumentID) {
            valueRef.current = fallbackValueRef.current;
            setValue(fallbackValueRef.current);
            setIsConnected(false);
            setIsSynced(false);
            setRemoteCursors([]);
            setRemoteMeta([]);
            return;
        }

        if (!currentUserUID) {
            valueRef.current = fallbackValueRef.current;
            setValue(fallbackValueRef.current);
            setIsConnected(false);
            setIsSynced(false);
            setRemoteCursors([]);
            setRemoteMeta([]);
            return;
        }

        const url = socket.getAuthorizedWebSocketUrl("editor-sync");
        if (!url) {
            valueRef.current = fallbackValueRef.current;
            setValue(fallbackValueRef.current);
            setIsConnected(false);
            setIsSynced(false);
            setRemoteCursors([]);
            setRemoteMeta([]);
            return;
        }

        const token = new URL(url).searchParams.get("authorization");

        const document = new Y.Doc();
        const text = document.getText(field);
        ytextRef.current = text;

        const provider = new HocuspocusProvider({
            document,
            name: resolvedDocumentID,
            token,
            url,
            onAuthenticated: () => {
                if (disposed) {
                    return;
                }
            },
            onConnect: () => {
                if (disposed) {
                    return;
                }
                setIsConnected(true);
            },
            onDisconnect: () => {
                if (disposed) {
                    return;
                }

                setIsConnected(false);
                setIsSynced(false);
            },
            onAuthenticationFailed: () => {
                if (disposed) {
                    return;
                }

                setIsConnected(false);
                setIsSynced(false);
            },
            onSynced: () => {
                if (disposed) {
                    return;
                }

                setIsSynced(true);
                if (text.length === 0 && fallbackValueRef.current) {
                    text.insert(0, fallbackValueRef.current);
                    return;
                }

                const nextValue = text.toString();
                valueRef.current = nextValue;
                setValue(nextValue);
                onValueChangeRef.current?.(nextValue);
            },
            onClose: () => {
                if (disposed) {
                    return;
                }

                setIsConnected(false);
                setIsSynced(false);
            },
        });
        providerRef.current = provider;

        const updateRemoteCursors = () => {
            if (disposed) {
                return;
            }

            const awareness = provider.awareness;
            if (!awareness) {
                setRemoteCursors([]);
                setRemoteMeta([]);
                return;
            }

            const cursors = Array.from(awareness.getStates().entries()).flatMap(([clientID, state]) => {
                const selection = state.collaborativeTextSelection as IAwarenessTextSelection | undefined;
                if (clientID === document.clientID || selection?.field !== field) {
                    return [];
                }

                return [
                    {
                        clientID,
                        color: selection.color,
                        name: selection.name,
                        selectionEnd: selection.selectionEnd,
                        selectionStart: selection.selectionStart,
                    },
                ];
            });

            setRemoteCursors(cursors);

            const nextRemoteMeta = Array.from(awareness.getStates().entries()).flatMap(([clientID, state]) => {
                const meta = state.collaborativeTextMeta as IAwarenessTextMeta | undefined;
                if (clientID === document.clientID || meta?.field !== field) {
                    return [];
                }

                return [
                    {
                        clientID,
                        color: meta.color,
                        name: meta.name,
                        userID: meta.userID,
                        value: meta.value,
                    },
                ];
            });

            setRemoteMeta(nextRemoteMeta);
        };

        const handleTextChange = () => {
            if (disposed) {
                return;
            }

            const nextValue = text.toString();
            isApplyingRemoteChangeRef.current = true;
            valueRef.current = nextValue;
            setValue(nextValue);
            onValueChangeRef.current?.(nextValue);
            queueMicrotask(() => {
                isApplyingRemoteChangeRef.current = false;
            });
        };

        text.observe(handleTextChange);
        provider.awareness?.on("change", updateRemoteCursors);

        return () => {
            disposed = true;
            text.unobserve(handleTextChange);
            provider.awareness?.off("change", updateRemoteCursors);
            provider.setAwarenessField("collaborativeTextSelection", null);
            provider.setAwarenessField("collaborativeTextMeta", null);
            provider.destroy();
            document.destroy();
            providerRef.current = null;
            ytextRef.current = null;
        };
    }, [currentUserUID, disabled, field, resolvedDocumentID, socket]);

    const updateValue = useCallback((nextValue: string) => {
        valueRef.current = nextValue;
        setValue(nextValue);
        onValueChangeRef.current?.(nextValue);

        const text = ytextRef.current;
        if (!text || isApplyingRemoteChangeRef.current) {
            return;
        }

        if (text.toString() === nextValue) {
            return;
        }

        text.doc?.transact(() => {
            text.delete(0, text.length);
            text.insert(0, nextValue);
        });
    }, []);

    const updateSelection = useCallback(
        (selectionStart: number, selectionEnd: number = selectionStart) => {
            providerRef.current?.setAwarenessField("collaborativeTextSelection", {
                color: userColor,
                field,
                name: userName,
                selectionEnd,
                selectionStart,
                userID: currentUser?.uid,
            } satisfies IAwarenessTextSelection);
        },
        [currentUser, field, userColor, userName]
    );

    const updateMeta = useCallback(
        (nextValue: unknown | null) => {
            providerRef.current?.setAwarenessField(
                "collaborativeTextMeta",
                nextValue === null
                    ? null
                    : ({
                          color: userColor,
                          field,
                          name: userName,
                          userID: currentUser?.uid,
                          value: nextValue,
                      } satisfies IAwarenessTextMeta)
            );
        },
        [currentUser, field, userColor, userName]
    );

    return {
        isConnected,
        isSynced,
        remoteMeta,
        remoteCursors,
        updateMeta,
        updateSelection,
        value,
        updateValue,
    };
};
