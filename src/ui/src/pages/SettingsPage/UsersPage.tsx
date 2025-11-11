import { Button, Flex, IconComponent, Toast } from "@/components/base";
import useDeleteSelectedUsersInSettings from "@/controllers/api/settings/users/useDeleteSelectedUsersInSettings";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import UserList from "@/pages/SettingsPage/components/users/UserList";
import { EHttpStatus } from "@langboard/core/enums";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function UsersPage() {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { isValidating, setIsValidating } = useAppSetting();
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const { mutate: deleteSelectedUsersMutate } = useDeleteSelectedUsersInSettings();

    useEffect(() => {
        setPageAliasRef.current("Users");
    }, []);

    const openCreateDialog = () => {
        navigate(ROUTES.SETTINGS.CREATE_USER);
    };

    const deleteSelectedUsers = () => {
        if (isValidating || !selectedUsers.length) {
            return;
        }

        setIsValidating(true);

        deleteSelectedUsersMutate(
            {
                user_uids: selectedUsers,
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.Selected webhooks deleted successfully."));
                    setSelectedUsers([]);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <>
            <Flex
                justify={{ sm: "between" }}
                direction={{ initial: "col", sm: "row" }}
                gap="2"
                mb="4"
                pb="2"
                textSize="3xl"
                weight="semibold"
                className="scroll-m-20 tracking-tight"
            >
                <span className="w-36">{t("settings.Users")}</span>
                <Flex gap="2" wrap justify="end" maxW={{ initial: "full", sm: "auto" }}>
                    {selectedUsers.length > 0 && (
                        <Button variant="destructive" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={deleteSelectedUsers}>
                            <IconComponent icon="trash" size="4" />
                            {t("common.Delete")}
                        </Button>
                    )}
                    <Button variant="outline" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={openCreateDialog}>
                        <IconComponent icon="plus" size="4" />
                        {t("settings.Add new")}
                    </Button>
                </Flex>
            </Flex>
            <UserList selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
        </>
    );
}

export default UsersPage;
