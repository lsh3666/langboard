"use client";

import * as React from "react";
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
import Box from "@/components/base/Box";

export interface IInternalLinkElementProps {
    isOpened: bool;
    setIsOpened: React.Dispatch<React.SetStateAction<bool>>;
    toLink: () => void;
}

function InternalLinkElementDialog({ isOpened, setIsOpened, toLink }: IInternalLinkElementProps) {
    const [t] = useTranslation();
    const goToLink = React.useCallback(() => {
        setIsOpened(false);
        setTimeout(() => {
            toLink();
        }, 0);
    }, [toLink]);

    return (
        <AlertDialog open={isOpened} onOpenChange={setIsOpened}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("common.Internal Link Warning")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription asChild>
                    <Box>
                        <Box maxW="full" textSize="base" weight="bold" className="text-red-500">
                            {t("common.This link leads to an internal resource.")}
                        </Box>
                        <Box maxW="full" textSize="base" weight="bold" className="text-red-500">
                            {t("common.Navigating to this link will cause you to lose all unsaved changes.")}
                        </Box>
                    </Box>
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={goToLink}>{t("common.Go to link")}</AlertDialogAction>
                    <AlertDialogCancel onClick={() => setIsOpened(false)}>{t("common.Close")}</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default InternalLinkElementDialog;
