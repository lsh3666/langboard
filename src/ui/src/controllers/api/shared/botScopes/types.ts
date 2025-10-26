import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";

export type TBotScopeRelatedParams = {
    target_table: TBotRelatedTargetTable;
    target_uid: string;
    bot_uid: string;
};
