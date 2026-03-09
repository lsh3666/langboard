import { type ButtonProps } from "@/components/base/Button";
import DropdownMenu from "@/components/base/DropdownMenu";

interface IBaseMoreMenuItemProps<TContent> {
    modal?: bool;
    menuName: React.ReactNode;
    triggerProps?: React.ComponentPropsWithoutRef<typeof DropdownMenu.Item>;
    contentProps?: TContent;
    useButtons?: bool;
    saveButtonProps?: Omit<ButtonProps, "type">;
    cancelButtonProps?: ButtonProps;
    saveText?: string;
    cancelText?: string;
    onSave?: (endCallback: (shouldClose: bool) => void) => void;
    onOpenChange?: (opened: bool) => void;
    children?: React.ReactNode;
}

interface IUseButtonsMoreMenuItemProps<TContent> extends IBaseMoreMenuItemProps<TContent> {
    useButtons?: true;
    saveButtonProps?: Omit<ButtonProps, "type">;
    cancelButtonProps?: ButtonProps;
    saveText?: string;
    cancelText?: string;
    onSave: (endCallback: (shouldClose: bool) => void) => void;
}

interface INoButtonsMoreMenuItemProps<TContent> extends IBaseMoreMenuItemProps<TContent> {
    useButtons: false;
    saveButtonProps?: never;
    cancelButtonProps?: never;
    saveText?: never;
    cancelText?: never;
    onSave?: never;
}

export type TMoreMenuItemProps<TContent> = IUseButtonsMoreMenuItemProps<TContent> | INoButtonsMoreMenuItemProps<TContent>;
