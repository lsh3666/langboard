import { ROLE_ALL_GRANTED, TBigIntString, TRoleAllGranted } from "@/core/db/BaseModel";
import BaseRole from "@/models/bases/BaseRole";
import { Entity, Column } from "typeorm";

export enum EApiKeyRoleAction {
    Read = "read",
    Create = "create",
    Update = "update",
    Delete = "delete",
}
export type TApiKeyRoleActions = EApiKeyRoleAction | keyof typeof EApiKeyRoleAction | TRoleAllGranted;

@Entity({ name: "api_key_role" })
class ApiKeyRole extends BaseRole {
    @Column({ type: "text", transformer: { to: (value: TApiKeyRoleActions[]) => value.join(","), from: (value: string) => value.split(",") } })
    public actions!: TApiKeyRoleActions[];

    public static async isGranted(userId: TBigIntString, action: TApiKeyRoleActions): Promise<bool> {
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

    public static async isAnyGranted(userId: TBigIntString): Promise<bool> {
        const apiKeyRole = await this.findOne({
            where: {
                user_id: userId,
            },
        });

        if (!apiKeyRole) {
            return false;
        }

        return apiKeyRole.actions.length > 0;
    }
}

export default ApiKeyRole;
