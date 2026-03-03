import { AuthUser } from "@/core/models";

export interface ISharedSettingsModalProps {
    opened: bool;
    setOpened: (opened: bool) => void;
    currentUser: AuthUser.TModel;
}
