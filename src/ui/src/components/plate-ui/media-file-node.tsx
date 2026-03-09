"use client";

import { cn } from "@/core/utils/ComponentUtils";
import type { TFileElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { useMediaState } from "@platejs/media/react";
import { ResizableProvider } from "@platejs/resizable";
import { FileUp, LoaderCircle } from "lucide-react";
import { PlateElement, useReadOnly, withHOC } from "platejs/react";
import { Caption, CaptionTextarea } from "@/components/plate-ui/caption";
import { useTranslation } from "react-i18next";
import Toast from "@/components/base/Toast";
import useDownloadFile from "@/core/hooks/useDownloadFile";

export const FileElement = withHOC(ResizableProvider, function FileElement(props: PlateElementProps<TFileElement>) {
    const [t] = useTranslation();
    const readOnly = useReadOnly();
    const { name, unsafeUrl } = useMediaState();

    const { download, isDownloading } = useDownloadFile({
        url: unsafeUrl,
        filename: name,
        onError: () => {
            Toast.Add.error(t("errors.Download failed."));
        },
    });

    return (
        <PlateElement className="my-px rounded-sm" {...props}>
            <a
                className={cn(
                    "group relative m-0 flex items-center rounded px-0.5 py-[3px]",
                    isDownloading ? "bg-muted/70" : "cursor-pointer hover:bg-muted"
                )}
                contentEditable={false}
                download={name}
                onClick={download}
                rel="noopener noreferrer"
                role="button"
            >
                <div className="flex items-center gap-1 p-1">
                    {isDownloading ? <LoaderCircle className="size-5 animate-spin" /> : <FileUp className="size-5" />}
                    <div>{name}</div>
                </div>

                <Caption align="left">
                    <CaptionTextarea className="text-left" readOnly={readOnly} placeholder={t("editor.Write a caption...")} />
                </Caption>
            </a>
            {props.children}
        </PlateElement>
    );
});
