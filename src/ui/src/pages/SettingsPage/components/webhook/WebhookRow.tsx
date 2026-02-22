import { Checkbox, Table } from "@/components/base";
import { IFlexProps } from "@/components/base/Flex";
import DateDistance from "@/components/DateDistance";
import { AppSettingModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import WebhookName from "@/pages/SettingsPage/components/webhook/WebhookName";
import WebhookURL from "@/pages/SettingsPage/components/webhook/WebhookURL";
import { memo } from "react";

export interface IWebhookRowProps extends IFlexProps {
    url: AppSettingModel.TModel;
    selectedWebhooks: string[];
    setSelectedWebhooks: React.Dispatch<React.SetStateAction<string[]>>;
}

const WebhookRow = memo(({ url, selectedWebhooks, setSelectedWebhooks, ...props }: IWebhookRowProps) => {
    const createdAt = url.useField("created_at");
    const lastUsedAt = url.useField("last_used_at");

    const toggleSelect = () => {
        setSelectedWebhooks((prev) => {
            if (prev.some((value) => value === url.uid)) {
                return prev.filter((value) => value !== url.uid);
            } else {
                return [...prev, url.uid];
            }
        });
    };

    return (
        <Table.FlexRow {...props}>
            <ModelRegistry.AppSettingModel.Provider model={url}>
                <Table.FlexCell className="w-12 text-center">
                    <Checkbox checked={selectedWebhooks.some((value) => value === url.uid)} onClick={toggleSelect} />
                </Table.FlexCell>
                <WebhookName />
                <WebhookURL />
                <Table.FlexCell className="w-1/6 truncate text-center">
                    <DateDistance date={createdAt} />
                </Table.FlexCell>
                <Table.FlexCell className="w-1/6 truncate text-center">
                    <DateDistance date={lastUsedAt} />
                </Table.FlexCell>
            </ModelRegistry.AppSettingModel.Provider>
        </Table.FlexRow>
    );
});

export default WebhookRow;
