import { useLocation } from "react-router";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { AccountSettingProvider } from "@/core/providers/AccountSettingProvider";
import EmailPage, { SkeletonEmailPage } from "@/pages/AccountPage/EmailPage";
import PasswordPage from "@/pages/AccountPage/PasswordPage";
import ProfilePage from "@/pages/AccountPage/ProfilePage";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import GroupsPage, { SkeletonGroupsPage } from "@/pages/AccountPage/GroupsPage";
import PreferencesPage from "@/pages/AccountPage/PreferencesPage";
import { useTranslation } from "react-i18next";

function AccountPage(): React.JSX.Element {
    const [t] = useTranslation();
    const { currentUser } = useAuth();
    const navigate = usePageNavigateRef();
    const location = useLocation();

    const headerNavs: Record<string, IHeaderNavItem> = {};

    const sidebarNavs: Record<string, ISidebarNavItem> = {
        [ROUTES.ACCOUNT.PROFILE]: {
            icon: "user-pen",
            name: t("myAccount.Profile"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PROFILE, { smooth: true });
            },
        },
        [ROUTES.ACCOUNT.EMAILS.ROUTE]: {
            icon: "mail",
            name: t("myAccount.Emails"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.EMAILS.ROUTE, { smooth: true });
            },
        },
        [ROUTES.ACCOUNT.PASSWORD]: {
            icon: "shield-alert",
            name: t("user.Password"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PASSWORD, { smooth: true });
            },
        },
        [ROUTES.ACCOUNT.GROUPS]: {
            icon: "users",
            name: t("myAccount.Groups"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.GROUPS, { smooth: true });
            },
        },
        [ROUTES.ACCOUNT.PREFERENCES]: {
            icon: "users",
            name: t("myAccount.Preferences"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PREFERENCES, { smooth: true });
            },
        },
    };

    const pathname: string = location.pathname;

    sidebarNavs[pathname].current = true;

    let pageContent;
    let skeletonContent;
    switch (pathname) {
        case ROUTES.ACCOUNT.PROFILE:
            pageContent = <ProfilePage />;
            skeletonContent = <></>;
            break;
        case ROUTES.ACCOUNT.EMAILS.ROUTE:
            pageContent = <EmailPage />;
            skeletonContent = <SkeletonEmailPage />;
            break;
        case ROUTES.ACCOUNT.PASSWORD:
            pageContent = <PasswordPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.ACCOUNT.GROUPS:
            pageContent = <GroupsPage />;
            skeletonContent = <SkeletonGroupsPage />;
            break;
        case ROUTES.ACCOUNT.PREFERENCES:
            pageContent = <PreferencesPage />;
            skeletonContent = <></>;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={Object.values(sidebarNavs)}>
            {!currentUser ? skeletonContent : <AccountSettingProvider currentUser={currentUser}>{pageContent}</AccountSettingProvider>}
        </DashboardStyledLayout>
    );
}

export default AccountPage;
