import { DropdownMenu, Toast } from "@/components/base";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import useDownloadFile from "@/core/hooks/useDownloadFile";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { IBoardCardAttachmentContextParams } from "@/pages/BoardPage/components/card/attachment/types";
import { useTranslation } from "react-i18next";

function BoardCardAttachmentMoreMenuDownload(): React.JSX.Element {
    const [t] = useTranslation();
    const { model: attachment } = ModelRegistry.ProjectCardAttachment.useContext<IBoardCardAttachmentContextParams>();
    const { setIsOpened } = useMoreMenu();
    const name = attachment.useField("name");
    const url = attachment.useField("url");
    const { download, isDownloading } = useDownloadFile(
        {
            url: url,
            filename: name,
            onError: () => {
                Toast.Add.error(t("errors.Download failed."));
            },
            onFinally: () => {
                setIsOpened(false);
            },
        },
        [setIsOpened]
    );

    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDownloading) {
            return;
        }

        download();
    };

    return (
        <DropdownMenu.Item onClick={handleDownload} disabled={isDownloading}>
            {t("common.Download")}
        </DropdownMenu.Item>
    );
}

export default BoardCardAttachmentMoreMenuDownload;
