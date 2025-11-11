import { TBotLogRelatedParams } from "@/controllers/api/shared/botLogs/types";
import { BotModel, Project, ProjectCard, ProjectColumn } from "@/core/models";
import { createContext, useContext } from "react";

export interface IBotLogListContext {
    bot: BotModel.TModel;
    params: TBotLogRelatedParams;
    target: Project.TModel | ProjectColumn.TModel | ProjectCard.TModel;
}

interface IBotLogListProviderProps {
    bot: BotModel.TModel;
    params: TBotLogRelatedParams;
    target: Project.TModel | ProjectColumn.TModel | ProjectCard.TModel;
    children: React.ReactNode;
}

const initialContext = {
    bot: {} as BotModel.TModel,
    params: {} as TBotLogRelatedParams,
    target: {} as Project.TModel | ProjectColumn.TModel | ProjectCard.TModel,
};

const BotLogListContext = createContext<IBotLogListContext>(initialContext);

export const BotLogListProvider = ({ bot, params, target, children }: IBotLogListProviderProps): React.ReactNode => {
    return (
        <BotLogListContext.Provider
            value={{
                bot,
                params,
                target,
            }}
        >
            {children}
        </BotLogListContext.Provider>
    );
};

export const useBotLogList = () => {
    const context = useContext(BotLogListContext);
    if (!context) {
        throw new Error("useBotLogList must be used within an BotLogListProvider");
    }
    return context;
};
