import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";

class ProjectRole extends BaseModel {
    @BigIntColumn(false)
    public user_id!: TBigIntString | null;
}

export default ProjectRole;
