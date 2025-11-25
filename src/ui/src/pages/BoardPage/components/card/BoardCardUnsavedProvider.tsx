import { createContext, useCallback, useContext, useMemo, useRef } from "react";

type TBoardCardUnsavedSection = "description";

interface IBoardCardUnsavedActionsContext {
    markSectionDirty: (section: TBoardCardUnsavedSection, dirty: bool) => void;
    resetSection: (section: TBoardCardUnsavedSection) => void;
    resetAll: () => void;
    getHasUnsavedChanges: () => bool;
}

const BoardCardUnsavedActionsContext = createContext<IBoardCardUnsavedActionsContext | null>(null);

export const BoardCardUnsavedProvider = ({ children }: { children: React.ReactNode }) => {
    const sectionStateRef = useRef<Partial<Record<TBoardCardUnsavedSection, bool>>>({});
    const hasUnsavedChangesRef = useRef(false);

    const updateDirtyFlag = useCallback(() => {
        hasUnsavedChangesRef.current = Object.values(sectionStateRef.current).some(Boolean);
    }, []);

    const markSectionDirty = useCallback(
        (section: TBoardCardUnsavedSection, dirty: bool) => {
            const next = sectionStateRef.current;
            if (!!next[section] === dirty) {
                return;
            }

            if (!dirty) {
                delete next[section];
            } else {
                next[section] = true;
            }

            updateDirtyFlag();
        },
        [updateDirtyFlag]
    );

    const resetSection = useCallback(
        (section: TBoardCardUnsavedSection) => {
            const next = sectionStateRef.current;
            if (!next[section]) {
                return;
            }

            delete next[section];
            updateDirtyFlag();
        },
        [updateDirtyFlag]
    );

    const resetAll = useCallback(() => {
        sectionStateRef.current = {};
        hasUnsavedChangesRef.current = false;
    }, []);

    const actionsValue = useMemo(
        () => ({
            markSectionDirty,
            resetSection,
            resetAll,
            getHasUnsavedChanges: () => hasUnsavedChangesRef.current,
        }),
        [markSectionDirty, resetSection, resetAll]
    );

    return <BoardCardUnsavedActionsContext.Provider value={actionsValue}>{children}</BoardCardUnsavedActionsContext.Provider>;
};

export const useBoardCardUnsavedActions = () => {
    const context = useContext(BoardCardUnsavedActionsContext);
    if (!context) {
        throw new Error("useBoardCardUnsavedActions must be used within BoardCardUnsavedProvider");
    }

    return context;
};
