import { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";
import SnowflakeID from "@/core/db/SnowflakeID";
import BaseChatSession from "@/models/bases/BaseChatSession";
import { Entity } from "typeorm";

@Entity({ name: "project_chat_session" })
class ProjectChatSession extends BaseChatSession {
    @BigIntColumn(false)
    public project_id!: TBigIntString;

    public override get apiResponse() {
        return {
            ...super.apiResponse,
            filterable_table: "project",
            filterable_uid: this.project_id ? new SnowflakeID(this.project_id).toShortCode() : undefined,
        };
    }

    public static async findByUID(uid: string): Promise<ProjectChatSession | null> {
        const id = SnowflakeID.fromShortCode(uid).toString();
        const session = await ProjectChatSession.createQueryBuilder()
            .select([
                "cast(id as text) as converted_id",
                "cast(chat_session_id as text) as converted_chat_session_id",
                "cast(project_id as text) as converted_project_id",
            ])
            .where("id = :id", { id })
            .getRawOne();

        if (!session) {
            return null;
        }

        session.id = session.converted_id;
        session.chat_session_id = session.converted_chat_session_id;
        session.project_id = session.converted_project_id;

        return ProjectChatSession.create({
            ...session,
        });
    }
}

export default ProjectChatSession;
