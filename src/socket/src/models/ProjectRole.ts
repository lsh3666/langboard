import { BigIntColumn, CsvColumn, ROLE_ALL_GRANTED, TBigIntString, TRoleAllGranted } from "@/core/db/BaseModel";
import DB from "@/core/db/DB";
import SnowflakeID from "@/core/db/SnowflakeID";
import BaseRole from "@/models/bases/BaseRole";
import { Entity } from "typeorm";

export enum EProjectRoleAction {
    Read = "read",
    Update = "update",
    CardWrite = "card_write",
    CardUpdate = "card_update",
    CardDelete = "card_delete",
}
export type TProjectRoleActions = EProjectRoleAction | keyof typeof EProjectRoleAction | TRoleAllGranted;

@Entity({ name: "project_role" })
class ProjectRole extends BaseRole {
    @BigIntColumn(false)
    public project_id!: TBigIntString;

    @CsvColumn()
    public actions!: TProjectRoleActions[];

    public static async isGranted(userId: TBigIntString, projectUID: string, action: TProjectRoleActions): Promise<bool> {
        const projectId = SnowflakeID.fromShortCode(projectUID).toString();
        const runner = DB.createQueryRunner("master");
        try {
            await runner.connect();
            const projectRole = await runner.manager.findOne(ProjectRole, {
                where: {
                    user_id: userId,
                    project_id: projectId,
                },
            });

            if (!projectRole) {
                return false;
            }

            if (projectRole.actions.includes(ROLE_ALL_GRANTED)) {
                return true;
            }

            return projectRole.actions.includes(action);
        } finally {
            await runner.release();
        }
    }
}

export default ProjectRole;
