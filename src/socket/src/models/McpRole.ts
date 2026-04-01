import { CsvColumn, ROLE_ALL_GRANTED, TBigIntString, TRoleAllGranted } from "@/core/db/BaseModel";
import DB from "@/core/db/DB";
import BaseRole from "@/models/bases/BaseRole";
import { Entity } from "typeorm";

export enum EMcpRoleAction {
    Read = "read",
    Create = "create",
    Update = "update",
    Delete = "delete",
}
export type TMcpRoleActions = EMcpRoleAction | keyof typeof EMcpRoleAction | TRoleAllGranted;

@Entity({ name: "mcp_role" })
class McpRole extends BaseRole {
    @CsvColumn()
    public actions!: TMcpRoleActions[];

    public static async isGranted(userId: TBigIntString, action: TMcpRoleActions): Promise<bool> {
        const mcpRole = await this.findOne({
            where: {
                user_id: userId,
            },
        });

        if (!mcpRole) {
            return false;
        }

        if (mcpRole.actions.includes(ROLE_ALL_GRANTED)) {
            return true;
        }

        return mcpRole.actions.includes(action);
    }

    public static async isAnyGranted(userId: TBigIntString): Promise<bool> {
        const runner = DB.createQueryRunner("master");
        try {
            await runner.connect();
            const mcpRole = await runner.manager.findOne(McpRole, {
                where: {
                    user_id: userId,
                },
            });

            if (!mcpRole) {
                return false;
            }

            return mcpRole.actions.length > 0;
        } finally {
            await runner.release();
        }
    }
}

export default McpRole;
