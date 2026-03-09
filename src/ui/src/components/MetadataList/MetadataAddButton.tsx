import Button from "@/components/base/Button";
import Flex from "@/components/base/Flex";
import Input from "@/components/base/Input";
import Popover from "@/components/base/Popover";
import SubmitButton from "@/components/base/SubmitButton";
import Toast from "@/components/base/Toast";
import { TMetadataForm } from "@/controllers/api/metadata/types";
import useSaveMetadata from "@/controllers/api/metadata/useSaveMetadata";
import setupApiErrorHandler, { IApiErrorHandlerMap } from "@/core/helpers/setupApiErrorHandler";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IMetadataAddButtonProps {
    form: TMetadataForm;
    errorsMap: (messageRef: { message: string }) => IApiErrorHandlerMap;
}

function MetadataAddButton({ form, errorsMap }: IMetadataAddButtonProps): React.JSX.Element {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const keyInputRef = useRef<HTMLInputElement>(null);
    const valueInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync: saveMetadataMutateAsync } = useSaveMetadata(form, { interceptToast: true });

    const add = () => {
        if (isValidating || !keyInputRef.current || !valueInputRef.current) {
            return;
        }

        if (!keyInputRef.current.value.length) {
            Toast.Add.error(t("metadata.errors.Key is required."));
            return;
        }

        setIsValidating(true);

        const promise = saveMetadataMutateAsync({
            key: keyInputRef.current.value,
            value: valueInputRef.current.value,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Adding..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(errorsMap(messageRef));

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Metadata added successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
            },
        });
    };

    return (
        <Popover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <Button variant="outline" className="w-full border-2 border-dashed" disabled={isValidating}>
                    {t("metadata.Add a data")}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-auto min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <Input placeholder={t("metadata.Key")} wrapperProps={{ className: "w-full" }} disabled={isValidating} ref={keyInputRef} />
                <Input placeholder={t("metadata.Value")} wrapperProps={{ className: "mt-2 w-full" }} disabled={isValidating} ref={valueInputRef} />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={add} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default MetadataAddButton;
