import { useAuth } from "@/core/providers/AuthProvider";
import { useSocket } from "@/core/providers/SocketProvider";
import { Utils } from "@langboard/core/utils";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

export interface IUseCollaborativeTextProps {
    documentID: string;
    field: string;
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

interface IAwarenessTextSelection {
    color: string;
    field: string;
    name: string;
    selectionEnd: number;
    selectionStart: number;
    userID?: string;
}

const normalizeValue = (value: IUseCollaborativeTextProps["defaultValue"]) => {
    if (Array.isArray(value)) {
        return value.join("");
    }

    return value?.toString() ?? "";
};

export const useCollaborativeText = ({ documentID, field, defaultValue, disabled, onValueChange }: IUseCollaborativeTextProps) => {
    const socket = useSocket();
    const { currentUser } = useAuth();
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
    const providerRef = useRef<HocuspocusProvider | null>(null);
    const ytextRef = useRef<Y.Text | null>(null);
    const isApplyingRemoteChangeRef = useRef(false);

    useEffect(() => {
        fallbackValueRef.current = fallbackValue;
    }, [fallbackValue]);

    useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    useEffect(() => {
        let disposed = false;

        if (disabled) {
            setValue(fallbackValueRef.current);
            setIsConnected(false);
            setIsSynced(false);
            setRemoteCursors([]);
            return;
        }

        const url = socket.getAuthorizedWebSocketUrl("editor-sync");
        if (!url) {
            setValue(fallbackValueRef.current);
            setIsConnected(false);
            setIsSynced(false);
            setRemoteCursors([]);
            return;
        }

        const token = new URL(url).searchParams.get("authorization") ?? "";
        const document = new Y.Doc();
        const text = document.getText(field);
        ytextRef.current = text;

        const provider = new HocuspocusProvider({
            document,
            name: documentID,
            token,
            url,
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
        };

        const handleTextChange = () => {
            if (disposed) {
                return;
            }

            const nextValue = text.toString();
            isApplyingRemoteChangeRef.current = true;
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
            provider.destroy();
            document.destroy();
            providerRef.current = null;
            ytextRef.current = null;
        };
    }, [disabled, documentID, field, socket]);

    const updateValue = useCallback((nextValue: string) => {
        setValue(nextValue);
        onValueChangeRef.current?.(nextValue);

        const text = ytextRef.current;
        if (!text || isApplyingRemoteChangeRef.current) {
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

    return {
        isConnected,
        isSynced,
        remoteCursors,
        updateSelection,
        value,
        updateValue,
    };
};
