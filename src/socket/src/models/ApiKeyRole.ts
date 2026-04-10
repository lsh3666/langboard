import { CsvColumn, ROLE_ALL_GRANTED, TBigIntString, TRoleAllGranted } from "@/core/db/BaseModel";
import DB from "@/core/db/DB";
import BaseRole from "@/models/bases/BaseRole";
import { Entity } from "typeorm";

export enum EApiKeyRoleAction {
    Read = "read",
    Create = "create",
    Update = "update",
    Delete = "delete",
}
export type TApiKeyRoleActions = EApiKeyRoleAction | keyof typeof EApiKeyRoleAction | TRoleAllGranted;

@Entity({ name: "api_key_role" })
class ApiKeyRole extends BaseRole {
    @CsvColumn()
    public actions!: TApiKeyRoleActions[];

    public static async isGranted(userId: TBigIntString, action: TApiKeyRoleActions): Promise<bool> {
        const runner = DB.createQueryRunner("master");
        try {
            await runner.connect();
            const apiKeyRole = await runner.manager.findOne(ApiKeyRole, {
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
        } finally {
            await runner.release();
        }
    }

    public static async isAnyGranted(userId: TBigIntString): Promise<bool> {
        const runner = DB.createQueryRunner("master");
        try {
            await runner.connect();
            const apiKeyRole = await runner.manager.findOne(ApiKeyRole, {
                where: {
                    user_id: userId,
                },
            });

            if (!apiKeyRole) {
                return false;
            }

            return apiKeyRole.actions.length > 0;
        } finally {
            await runner.release();
        }
    }
}

export default ApiKeyRole;
