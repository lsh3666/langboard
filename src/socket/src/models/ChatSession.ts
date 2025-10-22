import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";
import { getDatetimeType } from "@/core/db/DbType";
import SnowflakeID from "@/core/db/SnowflakeID";
import { Entity, Column } from "typeorm";

@Entity({ name: "chat_session" })
class ChatSession extends BaseModel {
    @Column({ type: "varchar" })
    public filterable_table!: string;

    @BigIntColumn(false)
    public filterable_id!: TBigIntString;

    @BigIntColumn(false)
    public user_id!: TBigIntString;

    @Column({ type: "varchar" })
    public title!: string;

    @Column({ type: getDatetimeType(), nullable: true, default: null })
    public last_messaged_at: Date | null = null;

    public get apiResponse() {
        return {
            uid: this.uid,
            filterable_table: this.filterable_table,
            filterable_uid: new SnowflakeID(this.filterable_id).toShortCode(),
            user_uid: this.user_id ? new SnowflakeID(this.user_id).toShortCode() : undefined,
            title: this.title,
            last_messaged_at: this.last_messaged_at,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
    }

    public static async findByUID(uid: string): Promise<ChatSession | null> {
        const id = SnowflakeID.fromShortCode(uid).toString();
        const session = await ChatSession.createQueryBuilder()
            .select(["cast(id as text) as converted_id", "filterable_table", "filterable_id", "user_id", "title", "last_messaged_at"])
            .where("id = :id", { id })
            .getRawOne();

        if (!session) {
            return null;
        }

        session.id = session.converted_id;

        return ChatSession.create({
            ...session,
        });
    }

    public updateLastMessagedAt(date?: Date) {
        this.last_messaged_at = date || new Date();
        return ChatSession.update(this.id, {
            last_messaged_at: this.last_messaged_at,
        });
    }
}

export default ChatSession;
