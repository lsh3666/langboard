import { IBaseModel } from "@/core/models/Base";
import { EBotPlatform, EBotPlatformRunningType } from "@langboard/core/ai";
import * as Project from "@/core/models/Project";
import * as ProjectColumn from "@/core/models/ProjectColumn";
import * as ProjectCard from "@/core/models/ProjectCard";

export type TBotRelatedTargetTable = "project" | "project_column" | "card";
export type TBotRelatedTargetModel = Project.TModel | ProjectColumn.TModel | ProjectCard.TModel;
export type TBotRelatedTargetInterface = Project.Interface | ProjectColumn.Interface | ProjectCard.Interface;

export interface IBaseBotModel extends IBaseModel {
    platform: EBotPlatform;
    platform_running_type: EBotPlatformRunningType;
}
