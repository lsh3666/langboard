import { Button, Dialog, DropdownMenu, Flex, SubmitButton } from "@/components/base";
import { MoreMenuItemProvider, useMoreMenuItem } from "@/components/MoreMenu/ItemProvider";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import { TMoreMenuItemProps } from "@/components/MoreMenu/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export type TMoreMenuDialogItemProps = TMoreMenuItemProps<React.ComponentProps<typeof Dialog.Content>>;

function MoreMenuDialogItem({ onSave, onOpenChange, ...props }: TMoreMenuDialogItemProps): React.JSX.Element {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <MoreMenuItemProvider isOpened={isOpened} setIsOpened={setIsOpened} onSave={onSave} onOpenChange={onOpenChange}>
            <MoreMenuDialogItemDisplay {...props} />
        </MoreMenuItemProvider>
    );
}

function MoreMenuDialogItemDisplay({
    modal,
    menuName,
    triggerProps,
    contentProps,
    useButtons = true,
    saveButtonProps,
    cancelButtonProps,
    saveText,
    cancelText,
    children,
}: Omit<TMoreMenuDialogItemProps, "onSave" | "onOpenChange">): React.JSX.Element {
    const [t] = useTranslation();
    const { isOpened, setIsOpened, save } = useMoreMenuItem();
    const { isValidating } = useMoreMenu();

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpened(true);
    };

    const handleClose = () => {
        setIsOpened(false);
    };

    return (
        <Dialog.Root modal={modal} open={isOpened} onOpenChange={setIsOpened}>
            <Dialog.Trigger asChild>
                <DropdownMenu.Item {...triggerProps} onClick={handleOpen}>
                    {menuName}
                </DropdownMenu.Item>
            </Dialog.Trigger>
            <Dialog.Content {...contentProps}>
                <Dialog.Title hidden />
                <Dialog.Description hidden />
                {children}
                {useButtons && (
                    <Flex items="center" justify="end" gap="1" mt="2">
                        <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={handleClose} {...cancelButtonProps}>
                            {cancelText ?? t("common.Cancel")}
                        </Button>
                        <SubmitButton type="button" size="sm" onClick={save} isValidating={isValidating} {...saveButtonProps}>
                            {saveText ?? t("common.Save")}
                        </SubmitButton>
                    </Flex>
                )}
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default MoreMenuDialogItem;
