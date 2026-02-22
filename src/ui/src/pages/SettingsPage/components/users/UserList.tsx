import { Checkbox } from "@/components/base";
import { User } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { useTranslation } from "react-i18next";
import PaginatedTable from "@/components/PaginatedTable";
import UserFirstname from "@/pages/SettingsPage/components/users/UserFirstname";
import UserLastname from "@/pages/SettingsPage/components/users/UserLastname";
import UserActivation from "@/pages/SettingsPage/components/users/UserActivation";
import UserAdmin from "@/pages/SettingsPage/components/users/UserAdmin";
import UserMoreMenu from "@/pages/SettingsPage/components/users/UserMoreMenu";
import DateDistance from "@/components/DateDistance";

export interface IUserListProps {
    selectedUsers: string[];
    setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
}

function UserList({ selectedUsers, setSelectedUsers }: IUserListProps) {
    const [t] = useTranslation();
    const { currentUser } = useAppSetting();

    return (
        <PaginatedTable
            form={{ listType: "User" }}
            modelFilter={(model) => model.isValidUser() && !model.isDeletedUser() && !!model.created_at && model.uid !== currentUser?.uid}
            columns={[
                {
                    key: "uid",
                    header: (users) => (
                        <Checkbox
                            checked={!!users.length && users.length === selectedUsers.length}
                            onClick={() => {
                                setSelectedUsers((prev) => {
                                    if (prev.length === users.length) {
                                        return [];
                                    } else {
                                        return users.map((user) => user.uid);
                                    }
                                });
                            }}
                        />
                    ),
                    align: "center",
                    width: "w-12",
                    render: ({ value: uid }) => (
                        <Checkbox
                            checked={selectedUsers.some((value) => value === uid)}
                            onClick={() => {
                                setSelectedUsers((prev) => {
                                    if (prev.some((value) => value === uid)) {
                                        return prev.filter((value) => value !== uid);
                                    } else {
                                        return [...prev, uid];
                                    }
                                });
                            }}
                        />
                    ),
                },
                {
                    key: "email",
                    header: t("user.Email"),
                    align: "center",
                    width: "w-[calc(calc(100%_/_12_*_3)_-_theme(spacing.12))]",
                    sortable: true,
                    filterable: true,
                    render: ({ row }) => <UserListItemEmail user={row} />,
                },
                {
                    key: "firstname",
                    header: t("user.First Name"),
                    align: "center",
                    width: "w-1/6 truncate",
                    sortable: true,
                    filterable: true,
                    render: ({ row }) => <UserFirstname user={row} />,
                },
                {
                    key: "lastname",
                    header: t("user.Last Name"),
                    align: "center",
                    width: "w-1/6 truncate",
                    sortable: true,
                    filterable: true,
                    render: ({ row }) => <UserLastname user={row} />,
                },
                {
                    key: "activated_at",
                    header: t("settings.Activation"),
                    align: "center",
                    width: "w-1/12",
                    render: ({ row }) => <UserActivation user={row} />,
                },
                {
                    key: "is_admin",
                    header: t("settings.Admin"),
                    align: "center",
                    width: "w-1/12",
                    render: ({ row }) => <UserAdmin user={row} />,
                },
                {
                    key: "created_at",
                    header: t("settings.Created"),
                    align: "center",
                    width: "w-1/6",
                    sortable: true,
                    render: ({ row }) => <UserListItemCreatedAt user={row} />,
                },
                {
                    key: "type",
                    header: t("common.More"),
                    align: "center",
                    width: "w-1/12",
                    render: ({ row }) => <UserMoreMenu user={row} />,
                },
            ]}
        />
    );
}

function UserListItemEmail({ user }: { user: User.TModel }) {
    const email = user.useField("email");
    return <>{email}</>;
}

function UserListItemCreatedAt({ user }: { user: User.TModel }) {
    const createdAt = user.useField("created_at");
    return <DateDistance date={createdAt} />;
}

export default UserList;
