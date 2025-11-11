import * as BaseBotScheduleModel from "@/core/models/botSchedules/BaseBotScheduleModel";
import { registerModel } from "@/core/models/ModelRegistry";

export interface Interface extends BaseBotScheduleModel.Interface {
    project_uid: string;
}

class ProjectBotSchedule extends BaseBotScheduleModel.Model<Interface> {
    public static get MODEL_NAME() {
        return "ProjectBotSchedule" as const;
    }

    public get project_uid() {
        return this.getValue("project_uid");
    }
    public set project_uid(value) {
        this.update({ project_uid: value });
    }
}

registerModel(ProjectBotSchedule);

export const Model = ProjectBotSchedule;
export type TModel = ProjectBotSchedule;
