import { Dialog } from "@/components/base";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { useAuth } from "@/core/providers/AuthProvider";
import { useBoardController } from "@/core/providers/BoardController";
import { getEditorStore } from "@/core/stores/EditorStore";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCard from "@/pages/BoardPage/components/card/BoardCard";
import { BoardCardUnsavedProvider, useBoardCardUnsavedActions } from "@/pages/BoardPage/components/card/BoardCardUnsavedProvider";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useMemo, useRef, useState, useEffect } from "react";
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

        document.addEventListener('compositionstart', handleCompositionStart);
        document.addEventListener('compositionend', handleCompositionEnd);

        return () => {
            document.removeEventListener('compositionstart', handleCompositionStart);
            document.removeEventListener('compositionend', handleCompositionEnd);
        };
    }, []);

    const alertDescription = useMemo(() => t("card.unsavedChanges.description"), [t]);

    return (
        <>
            {currentUser && cardUID && (
                <Dialog.Root open={true} onOpenChange={(isOpen) => !isOpen && handleCloseRequest()}>
                    <Dialog.Content
                        className={cn("max-w-[100vw] px-4 py-4 pb-0 sm:max-w-screen-sm sm:px-6 lg:max-w-screen-md", !!selectCardViewType && "hidden")}
                        aria-describedby=""
                        withCloseButton={false}
                        viewportRef={viewportRef}
                        overlayClassName={selectCardViewType ? "hidden" : ""}
                        disableOverlayClick={!!selectCardViewType}
                        onOverlayInteract={() => {
                            if (getHasUnsavedChanges()) {
                                requestClose();
                                return;
                            }

                            close();
                        }}
                    >
                        <BoardCard projectUID={projectUID} cardUID={cardUID} currentUser={currentUser} viewportRef={viewportRef} />
                    </Dialog.Content>
                </Dialog.Root>
            )}
            <AlertDialog open={isDirtyAlertOpen} onOpenChange={setIsDirtyAlertOpen}>
                <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("card.unsavedChanges.title")}</AlertDialogTitle>
                        <AlertDialogDescription className="whitespace-pre-line">{alertDescription}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("card.unsavedChanges.stay")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                resetAll();
                                setIsDirtyAlertOpen(false);
                                close();
                            }}
                        >
                            {t("card.unsavedChanges.leave")}
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
