import DateDistance from "@/components/DateDistance";
import { ApiKeySettingModel } from "@/core/models";

export interface IApiKeyCreatedAtProps {
    apiKey: ApiKeySettingModel.TModel;
}

function ApiKeyCreatedAt({ apiKey }: IApiKeyCreatedAtProps) {
    const createdAt = apiKey.useField("created_at");

    return <DateDistance date={createdAt} />;
}

export default ApiKeyCreatedAt;
