import * as BaseBotScopeModel from "@/core/models/botScopes/BaseBotScopeModel";
import {
    CARD_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    COLUMN_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    EBotTriggerCondition,
    PROJECT_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    WIKI_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
} from "@/core/models/botScopes/EBotTriggerCondition";
import { registerModel } from "@/core/models/ModelRegistry";

export interface Interface extends BaseBotScopeModel.Interface {
    project_uid: string;
}

class ProjectBotScope extends BaseBotScopeModel.Model<Interface> {
    public static get MODEL_NAME() {
        return "ProjectBotScope" as const;
    }

    public get project_uid() {
        return this.getValue("project_uid");
    }
    public set project_uid(value) {
        this.update({ project_uid: value });
    }
}

registerModel(ProjectBotScope);

export const Model = ProjectBotScope;
export type TModel = ProjectBotScope;

export const CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    ...PROJECT_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    ...WIKI_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    ...COLUMN_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
    ...CARD_CATEGORIZED_BOT_TRIGGER_CONDITIONS,
};

CATEGORIZED_BOT_TRIGGER_CONDITIONS.card.unshift(EBotTriggerCondition.CardCreated);
