import * as BaseBotScopeModel from "@/core/models/botScopes/BaseBotScopeModel";
import {
    CARD_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    COLUMN_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    EBotTriggerCondition,
} from "@/core/models/botScopes/EBotTriggerCondition";
import { registerModel } from "@/core/models/ModelRegistry";

export interface Interface extends BaseBotScopeModel.Interface {
    project_column_uid: string;
}

class ProjectColumnBotScope extends BaseBotScopeModel.Model<Interface> {
    public static get MODEL_NAME() {
        return "ProjectColumnBotScope" as const;
    }

    public get project_column_uid() {
        return this.getValue("project_column_uid");
    }
    public set project_column_uid(value) {
        this.update({ project_column_uid: value });
    }
}

registerModel(ProjectColumnBotScope);

export const Model = ProjectColumnBotScope;
export type TModel = ProjectColumnBotScope;

export const CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    ...COLUMN_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    ...CARD_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
};

CATEGORIZED_BOT_TRIGGER_CONDITIONS.card = [EBotTriggerCondition.CardCreated, ...CATEGORIZED_BOT_TRIGGER_CONDITIONS.card];
