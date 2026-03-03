import { memo } from "react";
import { useTranslation } from "react-i18next";
import UserAvatar from "@/components/UserAvatar";
import { ROUTES } from "@/core/routing/constants";
import { useSocket } from "@/core/providers/SocketProvider";
import { AuthUser } from "@/core/models";
import { useAuth } from "@/core/providers/AuthProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

interface IHeaderUserMenuProps {
    currentUser: AuthUser.TModel;
}

const HeaderUserMenu = memo(({ currentUser }: IHeaderUserMenuProps) => {
    const { signOut } = useAuth();
    const navigate = usePageNavigateRef();
    const [t] = useTranslation();
    const { close: closeSocket } = useSocket();

    return (
        <UserAvatar.Root
            userOrBot={currentUser}
            listAlign="end"
            avatarSize={{
                initial: "sm",
                md: "default",
            }}
            className="mx-1"
        >
            <UserAvatar.List>
                <UserAvatar.ListItem className="cursor-pointer" onClick={() => navigate(ROUTES.ACCOUNT.PROFILE, { smooth: true })}>
                    {t("myAccount.My account")}
                </UserAvatar.ListItem>
                <UserAvatar.ListSeparator />
                <UserAvatar.ListItem className="cursor-pointer" onClick={() => navigate(ROUTES.SETTINGS.ROUTE, { smooth: true })}>
                    {t("settings.App settings")}
                </UserAvatar.ListItem>
                <UserAvatar.ListSeparator />
                <UserAvatar.ListItem
                    className="cursor-pointer"
                    onClick={async () => {
                        closeSocket();
                        await signOut();
                    }}
                >
                    {t("myAccount.Sign out")}
                </UserAvatar.ListItem>
                <UserAvatar.ListSeparator />
            </UserAvatar.List>
        </UserAvatar.Root>
    );
});

export default HeaderUserMenu;
