import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import { useEffect, useState } from "react";
import mimeTypes from "react-native-mime-types";

export interface IChatInputFilePreviewProps {
    file: File;
}

function ChatInputFilePreview({ file }: IChatInputFilePreviewProps) {
    const type = mimeTypes.lookup(file.name) || "file";
    const [previewData, setPreviewData] = useState<string | null>(null);

    useEffect(() => {
        if (!type.startsWith("image/")) {
            setPreviewData(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setPreviewData(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    return (
        <Flex size="full" justify="center" items="center">
            {type.startsWith("image/") && previewData ? (
                <img src={previewData ?? ""} alt={file.name} className="h-20 w-auto" />
            ) : (
                <Flex direction="col" items="center" justify="center" className="border-border text-center" w="full" h="20" border rounded="md">
                    <IconComponent icon="file" size="6" />
                    <span className="w-[calc(100%_-_theme(spacing.4))] truncate">{file.name}</span>
                </Flex>
            )}
        </Flex>
    );
}

export default ChatInputFilePreview;
