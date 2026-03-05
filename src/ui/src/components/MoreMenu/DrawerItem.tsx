import { Button, Drawer, DropdownMenu, Flex, SubmitButton } from "@/components/base";
import { MoreMenuItemProvider, useMoreMenuItem } from "@/components/MoreMenu/ItemProvider";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import { TMoreMenuItemProps } from "@/components/MoreMenu/types";
import useHandleInteractOutside from "@/core/hooks/useHandleInteractOutside";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export type TMoreMenuDrawerItemProps = TMoreMenuItemProps<React.ComponentProps<typeof Drawer.Content>>;

function MoreMenuDrawerItem({ onSave, onOpenChange, ...props }: TMoreMenuDrawerItemProps): React.JSX.Element {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <MoreMenuItemProvider isOpened={isOpened} setIsOpened={setIsOpened} onSave={onSave} onOpenChange={onOpenChange}>
            <MoreMenuDrawerItemDisplay {...props} />
        </MoreMenuItemProvider>
    );
}

function MoreMenuDrawerItemDisplay({
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
}: Omit<TMoreMenuDrawerItemProps, "onSave" | "onOpenChange">): React.JSX.Element {
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
        <Drawer.Root modal={modal} open={isOpened} onOpenChange={setIsOpened}>
            <Drawer.Trigger asChild>
                <DropdownMenu.Item {...triggerProps} onClick={handleOpen}>
                    {menuName}
                </DropdownMenu.Item>
            </Drawer.Trigger>
            <Drawer.Content focusGuards={false} onInteractOutside={onInteractOutside} onPointerDownOutside={onPointerDownOutside} {...contentProps}>
                <Drawer.Title hidden />
                <Drawer.Description hidden />
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
            </Drawer.Content>
        </Drawer.Root>
    );
}

export default MoreMenuDrawerItem;
