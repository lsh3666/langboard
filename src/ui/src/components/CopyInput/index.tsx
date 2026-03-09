import IconComponent from "@/components/base/IconComponent";
import Input from "@/components/base/Input";
import Toast from "@/components/base/Toast";
import { copyToClipboard, selectAllText } from "@/core/utils/ComponentUtils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface ICopyInputProps {
    value?: string;
    className?: string;
}

function CopyInput({ value, className }: ICopyInputProps) {
    const [t] = useTranslation();
    const [isCopied, setIsCopied] = useState(false);

    const copy = async (e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        if (!value) {
            return;
        }

        selectAllText(e.currentTarget);
        await copyToClipboard(value);
        setIsCopied(true);
        Toast.Add.success(t("common.Copied."));
    };

    return (
        <Input
            wrapperProps={{ className }}
            value={value}
            readOnly
            onFocus={copy}
            onClick={copy}
            className={isCopied ? "pr-9 focus-visible:ring-green-700" : ""}
            rightIcon={isCopied && <IconComponent icon="check" size="5" className="text-green-500" />}
        />
    );
}

export default CopyInput;
