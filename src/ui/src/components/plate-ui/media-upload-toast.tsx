"use client";

import * as React from "react";
import { PlaceholderPlugin, UploadErrorCode } from "@platejs/media/react";
import { usePluginOption } from "platejs/react";
import Toast from "@/components/base/Toast";
import { useTranslation } from "react-i18next";

export function MediaUploadToast() {
    useUploadErrorToast();

    return null;
}

const useUploadErrorToast = () => {
    const [t] = useTranslation();

    const uploadError = usePluginOption(PlaceholderPlugin, "error");

    React.useEffect(() => {
        if (!uploadError) return;

        const { code, data } = uploadError;

        switch (code) {
            case UploadErrorCode.INVALID_FILE_SIZE: {
                Toast.Add.error(
                    t("editor.errors.invalid.file.size", {
                        files: data.files.map((f) => f.name).join(", "),
                    })
                );

                break;
            }
            case UploadErrorCode.INVALID_FILE_TYPE: {
                Toast.Add.error(
                    t("editor.errors.invalid.file.type", {
                        files: data.files.map((f) => f.name).join(", "),
                    })
                );

                break;
            }
            case UploadErrorCode.TOO_LARGE: {
                Toast.Add.error(
                    t("editor.errors.invalid.file.large", {
                        files: data.files.map((f) => f.name).join(", "),
                        maxFileSize: data.maxFileSize,
                    })
                );

                break;
            }
            case UploadErrorCode.TOO_LESS_FILES: {
                Toast.Add.error(
                    t("editor.errors.invalid.file.min", {
                        minFileCount: data.minFileCount,
                        fileType: data.fileType,
                    })
                );

                break;
            }
            case UploadErrorCode.TOO_MANY_FILES: {
                Toast.Add.error(
                    t("editor.errors.invalid.file.max", {
                        maxFileCount: data.maxFileCount,
                        fileType: data.fileType ? `for ${data.fileType}` : "",
                    })
                );

                break;
            }
        }
    }, [uploadError]);
};
