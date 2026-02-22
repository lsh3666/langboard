import { useTranslation } from "react-i18next";
import PaginatedTable from "@/components/PaginatedTable";
import ApiKeyName from "@/pages/SettingsPage/components/apiKeys/ApiKeyName";
import ApiKeyActivation from "@/pages/SettingsPage/components/apiKeys/ApiKeyActivation";
import ApiKeyCreatedAt from "@/pages/SettingsPage/components/apiKeys/ApiKeyCreatedAt";
import ApiKeyMoreMenu from "@/pages/SettingsPage/components/apiKeys/ApiKeyMoreMenu";
import { Checkbox, Flex } from "@/components/base";
import { Utils } from "@langboard/core/utils";

export interface IApiKeyListProps {
    selectedKeys: string[];
    setSelectedKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

function ApiKeyList({ selectedKeys, setSelectedKeys }: IApiKeyListProps) {
    const [t] = useTranslation();

    return (
        <PaginatedTable
            form={{ listType: "ApiKeySettingModel" }}
            modelFilter={(model) => !!model.name && !!model.created_at}
            columns={[
                {
                    key: "uid",
                    header: (apiKeys) => (
                        <Checkbox
                            checked={!!apiKeys.length && apiKeys.length === selectedKeys.length}
                            onClick={() => {
                                setSelectedKeys((prev) => {
                                    if (prev.length === apiKeys.length) {
                                        return [];
                                    } else {
                                        return apiKeys.map((apiKey) => apiKey.uid);
                                    }
                                });
                            }}
                        />
                    ),
                    align: "center",
                    width: "w-1/12",
                    render: ({ value: uid }) => (
                        <Flex justify="center" w="full">
                            <Checkbox
                                checked={selectedKeys.some((value) => value === uid)}
                                onClick={() => {
                                    setSelectedKeys((prev) => {
                                        if (prev.some((value) => value === uid)) {
                                            return prev.filter((value) => value !== uid);
                                        } else {
                                            return [...prev, uid];
                                        }
                                    });
                                }}
                            />
                        </Flex>
                    ),
                },
                {
                    key: "name",
                    header: t("settings.Name"),
                    align: "center",
                    width: "w-1/3",
                    sortable: true,
                    render: ({ row }) => <ApiKeyName apiKey={row} />,
                },
                {
                    key: "activated_at",
                    header: t("settings.Activation"),
                    align: "center",
                    width: "w-1/12",
                    render: ({ row }) => <ApiKeyActivation apiKey={row} />,
                },
                {
                    key: "created_at",
                    header: t("settings.Created"),
                    align: "center",
                    width: "w-1/6",
                    sortable: true,
                    render: ({ row }) => <ApiKeyCreatedAt apiKey={row} />,
                },
                {
                    key: "expires_at",
                    header: t("settings.Expires"),
                    align: "center",
                    width: "w-1/6",
                    sortable: true,
                    render: ({ row }) =>
                        row.expires_at ? (
                            <span style={{ color: row.is_expired ? "red" : undefined }}>{Utils.String.formatDateLocale(row.expires_at)}</span>
                        ) : (
                            <span style={{ color: "gray" }}>{t("settings.Never")}</span>
                        ),
                },
                {
                    key: "user_uid",
                    header: t("common.More"),
                    align: "center",
                    width: "w-1/12",
                    render: ({ row }) => <ApiKeyMoreMenu apiKey={row} />,
                },
            ]}
        />
    );
}

export default ApiKeyList;
