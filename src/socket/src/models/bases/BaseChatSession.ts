import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";

abstract class BaseChatSession extends BaseModel {
    @BigIntColumn(false)
    public chat_session_id!: TBigIntString;

    public get apiResponse() {
        return {
            uid: this.uid,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
    }
}

export default BaseChatSession;
