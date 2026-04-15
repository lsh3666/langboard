import Dialog from "@/components/base/Dialog";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { useAuth } from "@/core/providers/AuthProvider";
import { useBoardController } from "@/core/providers/BoardController";
import { ROUTES } from "@/core/routing/constants";
import { getEditorStore } from "@/core/stores/EditorStore";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCard from "@/pages/BoardPage/components/card/BoardCard";
import { BoardCardUnsavedProvider, useBoardCardUnsavedActions } from "@/pages/BoardPage/components/card/BoardCardUnsavedProvider";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useRef, useState, useEffect } from "react";
import { Navigate, useParams } from "react-router";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/plate-ui/alert-dialog";
import { useTranslation } from "react-i18next";

const BoardCardPageComponent = () => {
    const navigate = usePageNavigateRef();
    const { currentUser } = useAuth();
    const { projectUID, cardUID } = useParams();
    const { selectCardViewType } = useBoardController();
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [isDirtyAlertOpen, setIsDirtyAlertOpen] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const { resetAll, getHasUnsavedChanges } = useBoardCardUnsavedActions();
    const [t] = useTranslation();

    if (!projectUID || !cardUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const close = () => {
        navigate({
            pathname: ROUTES.BOARD.MAIN(projectUID),
            search: window.location.search,
        });
    };

    const requestClose = () => {
        setIsDirtyAlertOpen(true);
    };

    const handleCloseRequest = () => {
        // Ignore close request during IME composition to prevent double ESC handling
        if (isComposing) {
            return;
        }

        if (getHasUnsavedChanges()) {
            requestClose();
            return;
        }

        close();
    };

    // Detect IME composition state to handle Korean input properly
    useEffect(() => {
        const handleCompositionStart = () => setIsComposing(true);
        const handleCompositionEnd = () => setIsComposing(false);

        document.addEventListener("compositionstart", handleCompositionStart);
        document.addEventListener("compositionend", handleCompositionEnd);

        return () => {
            document.removeEventListener("compositionstart", handleCompositionStart);
            document.removeEventListener("compositionend", handleCompositionEnd);
        };
    }, []);

    return (
        <>
            {currentUser && cardUID && (
                <Dialog.Root open={true} onOpenChange={(isOpen) => !isOpen && handleCloseRequest()}>
                    <Dialog.Content
                        className={cn(
                            "h-[calc(100dvh-theme(spacing.8))] max-h-[calc(100dvh-theme(spacing.8))] max-w-[100vw] overflow-visible",
                            "border-0 bg-transparent p-0 shadow-none",
                            "sm:h-[calc(100dvh-theme(spacing.12))] sm:max-h-[calc(100dvh-theme(spacing.12))] sm:max-w-[90vw] lg:max-w-[1120px]",
                            !!selectCardViewType && "hidden"
                        )}
                        aria-describedby=""
                        withCloseButton={false}
                        viewportRef={viewportRef}
                        overlayClassName={selectCardViewType ? "hidden" : ""}
                        disableOverlayClick={!!selectCardViewType}
                        onOverlayInteract={(event) => {
                            if (getHasUnsavedChanges()) {
                                requestClose();
                                return;
                            }

                            if (getEditorStore().isInCurrentEditor()) {
                                event.preventDefault();
                                event.stopPropagation();

                                getEditorStore().setCurrentEditor(null);
                            }
                        }}
                    >
                        <BoardCard projectUID={projectUID} cardUID={cardUID} currentUser={currentUser} viewportRef={viewportRef} />
                    </Dialog.Content>
                </Dialog.Root>
            )}
            <AlertDialog open={isDirtyAlertOpen} onOpenChange={setIsDirtyAlertOpen}>
                <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("card.unsavedChanges.Discard description edits?")}</AlertDialogTitle>
                        <AlertDialogDescription className="whitespace-pre-line">
                            {t("card.unsavedChanges.You have unsaved description changes.\nLeaving now will discard them.")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("card.unsavedChanges.Keep editing")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                resetAll();
                                setIsDirtyAlertOpen(false);
                                close();
                            }}
                        >
                            {t("card.unsavedChanges.Discard changes")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

const BoardCardPage = memo(() => {
    return (
        <BoardCardUnsavedProvider>
            <BoardCardPageComponent />
        </BoardCardUnsavedProvider>
    );
});

export default BoardCardPage;
