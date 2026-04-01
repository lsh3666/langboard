import { CsvColumn, ROLE_ALL_GRANTED, TBigIntString, TRoleAllGranted } from "@/core/db/BaseModel";
import BaseRole from "@/models/bases/BaseRole";
import { Utils } from "@langboard/core/utils";
import { Entity } from "typeorm";

export enum ESettingRoleAction {
    // User Management
    UserRead = "user_read",
    UserCreate = "user_create",
    UserUpdate = "user_update",
    UserDelete = "user_delete",

    // Bot Management
    BotRead = "bot_read",
    BotCreate = "bot_create",
    BotUpdate = "bot_update",
    BotDelete = "bot_delete",

    // Internal Bot Management
    InternalBotRead = "internal_bot_read",
    InternalBotCreate = "internal_bot_create",
    InternalBotUpdate = "internal_bot_update",
    InternalBotDelete = "internal_bot_delete",

    // Global Relationship Management
    GlobalRelationshipRead = "global_relationship_read",
    GlobalRelationshipCreate = "global_relationship_create",
    GlobalRelationshipUpdate = "global_relationship_update",
    GlobalRelationshipDelete = "global_relationship_delete",

    // Webhook Management
    WebhookRead = "webhook_read",
    WebhookCreate = "webhook_create",
    WebhookUpdate = "webhook_update",
    WebhookDelete = "webhook_delete",

    // Ollama Management
    OllamaRead = "ollama_read",
}
export type TSettingRoleActions = ESettingRoleAction | keyof typeof ESettingRoleAction | TRoleAllGranted;

export enum ESettingCategory {
    User = "user",
    Bot = "bot",
    InternalBot = "internal_bot",
    GlobalRelationship = "global_relationship",
    Webhook = "webhook",
    Ollama = "ollama",
}

@Entity({ name: "setting_role" })
class SettingRole extends BaseRole {
    @CsvColumn()
    public actions!: TSettingRoleActions[];

    public static async isGranted(userId: TBigIntString, action: TSettingRoleActions): Promise<bool> {
        const apiKeyRole = await this.findOne({
            where: {
                user_id: userId,
            },
        });

        if (!apiKeyRole) {
            return false;
        }

        if (apiKeyRole.actions.includes(ROLE_ALL_GRANTED)) {
            return true;
        }

        return apiKeyRole.actions.includes(action);
    }

    public static async isCategoryGranted(userId: TBigIntString, category: ESettingCategory): Promise<bool> {
        category = Utils.String.convertSafeEnum(ESettingCategory, category);
        const categoryActions = Object.values(ESettingRoleAction).filter((action) => action.startsWith(category));
        const apiKeyRole = await this.findOne({
            where: {
                user_id: userId,
            },
        });

        if (!apiKeyRole) {
            return false;
        }

        if (apiKeyRole.actions.includes(ROLE_ALL_GRANTED)) {
            return true;
        }

        return categoryActions.some((action) => apiKeyRole.actions.includes(action));
    }
}

export default SettingRole;
