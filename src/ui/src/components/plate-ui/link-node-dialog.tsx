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

export interface ILinkElementProps {
    isOpened: bool;
    setIsOpened: React.Dispatch<React.SetStateAction<bool>>;
    href?: string;
}

function LinkElementDialog({ isOpened, setIsOpened, href }: ILinkElementProps) {
    const [t] = useTranslation();
    const goToLink = React.useCallback(() => {
        if (href) {
            location.href = href;
        } else {
            setIsOpened(false);
        }
    }, [href]);
    const openInNewTab = React.useCallback(() => {
        if (href) {
            window.open(href, "_blank", "noopener noreferrer");
        }

        setIsOpened(false);
    }, [href]);

    return (
        <AlertDialog open={isOpened} onOpenChange={setIsOpened}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("common.External Link Warning")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription asChild>
                    <Box>
                        <Box maxW="full" textSize="base" weight="bold" className="text-red-500">
                            {t("common.This link leads to an external website.")}
                        </Box>
                        <Box maxW="full" textSize="base" weight="bold" className="text-red-500">
                            {t("common.We can't guarantee the safety or privacy of external sites, so please proceed with caution.")}
                        </Box>
                    </Box>
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={goToLink}>{t("common.Go to link")}</AlertDialogAction>
                    <AlertDialogAction onClick={openInNewTab}>{t("common.Open in new tab")}</AlertDialogAction>
                    <AlertDialogCancel onClick={() => setIsOpened(false)}>{t("common.Close")}</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default LinkElementDialog;
