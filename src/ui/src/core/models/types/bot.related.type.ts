import { IBaseModel } from "@/core/models/Base";
import { EBotPlatform, EBotPlatformRunningType } from "@langboard/core/ai";

export type TBotRelatedTargetTable = "project" | "project_column" | "card";

export interface IBaseBotModel extends IBaseModel {
    platform: EBotPlatform;
    platform_running_type: EBotPlatformRunningType;
}
