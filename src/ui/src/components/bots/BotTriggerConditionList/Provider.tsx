import { TBotScopeRelatedParams } from "@/controllers/api/shared/botScopes/types";
import { ProjectBotScope, ProjectCardBotScope, ProjectColumnBotScope } from "@/core/models";
import { EBotTriggerCondition } from "@/core/models/botScopes/EBotTriggerCondition";
import { TBotScopeModel, TBotScopeModelName } from "@/core/models/ModelRegistry";
import { createContext, useContext } from "react";

export interface IBotTriggerConditionListContext {
    params: TBotScopeRelatedParams;
    botUID: string;
    categories: Record<string, EBotTriggerCondition[]>;
    botScope?: TBotScopeModel<TBotScopeModelName>;
}

interface IBotTriggerConditionListProviderProps {
    params: TBotScopeRelatedParams;
    botUID: string;
    botScope?: TBotScopeModel<TBotScopeModelName>;
    children: React.ReactNode;
}

const initialContext = {
    params: {} as TBotScopeRelatedParams,
    botUID: "",
    categories: {},
    botScope: undefined,
};

const BotTriggerConditionListContext = createContext<IBotTriggerConditionListContext>(initialContext);

export const BotTriggerConditionListProvider = ({ params, botUID, botScope, children }: IBotTriggerConditionListProviderProps): React.ReactNode => {
    let categories;
    switch (params.target_table) {
        case "project":
            categories = ProjectBotScope.CATEGORIZED_BOT_TRIGGER_CONDITIONS;
            break;
        case "project_column":
            categories = ProjectColumnBotScope.CATEGORIZED_BOT_TRIGGER_CONDITIONS;
            break;
        case "card":
            categories = ProjectCardBotScope.CATEGORIZED_BOT_TRIGGER_CONDITIONS;
            break;
        default:
            throw new Error(`Unsupported target_table: ${(params as Record<string, string>).target_table}`);
    }

    return (
        <BotTriggerConditionListContext.Provider
            value={{
                params,
                botUID,
                categories,
                botScope,
            }}
        >
            {children}
        </BotTriggerConditionListContext.Provider>
    );
};

export const useBotTriggerConditionList = () => {
    const context = useContext(BotTriggerConditionListContext);
    if (!context) {
        throw new Error("useBotTriggerConditionList must be used within an BotTriggerConditionListProvider");
    }
    return context;
};
