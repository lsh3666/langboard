import { ApiKeySettingModel } from "@/core/models";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IApiKeyIpWhitelistProps {
    apiKey: ApiKeySettingModel.TModel;
}

const ApiKeyIpWhitelist = memo(({ apiKey }: IApiKeyIpWhitelistProps) => {
    const [t] = useTranslation();
    const ipWhitelist = apiKey.useField("ip_whitelist");

    const getIpWhitelistText = (ips: string[]) => {
        if (!ips || ips.length === 0) {
            return t("settings.All IPs");
        }
        if (ips.length === 1) {
            return ips[0];
        }
        return `${ips[0]} +${ips.length - 1}`;
    };

    return <span className="truncate text-center">{getIpWhitelistText(ipWhitelist)}</span>;
});

export default ApiKeyIpWhitelist;
