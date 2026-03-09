import Flex from "@/components/base/Flex";
import BoardCardActionAttachedFile from "@/pages/BoardPage/components/card/action/file/BoardCardActionAttachedFile";
import { IAttachedFile } from "@/pages/BoardPage/components/card/action/types";
import { memo } from "react";

export interface IBoardCardActionAttachedFileListProps {
    attachedFiles: IAttachedFile[];
    deleteFile: (key: string) => void;
}

const BoardCardActionAttachedFileList = memo(({ attachedFiles, deleteFile }: IBoardCardActionAttachedFileListProps) => {
    return (
        <Flex direction="col" gap="2">
            {attachedFiles.map((attachedFile) => (
                <BoardCardActionAttachedFile key={`attached-file-${attachedFile.uid}`} attachedFile={attachedFile} deleteFile={deleteFile} />
            ))}
        </Flex>
    );
});

export default BoardCardActionAttachedFileList;
