import { TBotLogRelatedParams } from "@/controllers/api/shared/botLogs/types";
import { BotModel } from "@/core/models";
import { TBotRelatedTargetModel } from "@/core/models/types/bot.related.type";
import { createContext, useContext } from "react";

export interface IBotLogListContext {
    bot: BotModel.TModel;
    params: TBotLogRelatedParams;
    target: TBotRelatedTargetModel;
}

interface IBotLogListProviderProps {
    bot: BotModel.TModel;
    params: TBotLogRelatedParams;
    target: TBotRelatedTargetModel;
    children: React.ReactNode;
}

const initialContext = {
    bot: {} as BotModel.TModel,
    params: {} as TBotLogRelatedParams,
    target: {} as TBotRelatedTargetModel,
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
