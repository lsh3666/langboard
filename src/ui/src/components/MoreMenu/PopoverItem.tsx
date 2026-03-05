import { Button, DropdownMenu, Flex, Popover, SubmitButton } from "@/components/base";
import { MoreMenuItemProvider, useMoreMenuItem } from "@/components/MoreMenu/ItemProvider";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import { TMoreMenuItemProps } from "@/components/MoreMenu/types";
import useHandleInteractOutside from "@/core/hooks/useHandleInteractOutside";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export type TMoreMenuPopoverItemProps = TMoreMenuItemProps<React.ComponentProps<typeof Popover.Content>>;

function MoreMenuPopoverItem({ onSave, onOpenChange, ...props }: TMoreMenuPopoverItemProps): React.JSX.Element {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <MoreMenuItemProvider isOpened={isOpened} setIsOpened={setIsOpened} onSave={onSave} onOpenChange={onOpenChange}>
            <MoreMenuPopoverItemDisplay {...props} />
        </MoreMenuItemProvider>
    );
}

function MoreMenuPopoverItemDisplay({
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
}: Omit<TMoreMenuPopoverItemProps, "onSave" | "onOpenChange">): React.JSX.Element {
    const [t] = useTranslation();
    const { isOpened, setIsOpened, save } = useMoreMenuItem();
    const { isValidating } = useMoreMenu();
    const { onInteractOutside, onPointerDownOutside } = useHandleInteractOutside({ pointerDownOutside: () => setIsOpened(false) }, [setIsOpened]);

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpened(true);
    };

    const handleClose = () => {
        setIsOpened(false);
    };

    return (
        <Popover.Root modal={modal} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item {...triggerProps} onClick={handleOpen}>
                    {menuName}
                </DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content align="end" onInteractOutside={onInteractOutside} onPointerDownOutside={onPointerDownOutside} {...contentProps}>
                <Flex direction="col" gap="2">
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
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default MoreMenuPopoverItem;
