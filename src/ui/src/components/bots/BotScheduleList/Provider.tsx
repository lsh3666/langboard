import { TBotScheduleRelatedParams } from "@/controllers/api/shared/botSchedules/types";
import { BotModel, BaseBotScheduleModel, ProjectCard, ProjectColumn, Project } from "@/core/models";
import { createContext, useContext, useEffect, useState } from "react";

export interface IBotScheduleFormMap {
    runningType?: BaseBotScheduleModel.ERunningType;
    startAt?: Date;
    endAt?: Date;
    interval?: string;
}

export interface IBotScheduleListContext {
    bot: BotModel.TModel;
    params: TBotScheduleRelatedParams;
    target: Project.TModel | ProjectColumn.TModel | ProjectCard.TModel;
    copiedForm?: IBotScheduleFormMap;
    setCopiedForm: React.Dispatch<React.SetStateAction<IBotScheduleFormMap | undefined>>;
    isAddMode: bool;
    setIsAddMode: React.Dispatch<React.SetStateAction<bool>>;
}

interface IBotScheduleListProviderProps {
    bot: BotModel.TModel;
    params: TBotScheduleRelatedParams;
    target: Project.TModel | ProjectColumn.TModel | ProjectCard.TModel;
    children: React.ReactNode;
}

const initialContext = {
    bot: {} as BotModel.TModel,
    params: {} as TBotScheduleRelatedParams,
    target: {} as Project.TModel | ProjectColumn.TModel | ProjectCard.TModel,
    copiedForm: undefined,
    setCopiedForm: () => {},
    isAddMode: false,
    setIsAddMode: () => {},
};

const BotScheduleListContext = createContext<IBotScheduleListContext>(initialContext);

export const BotScheduleListProvider = ({ bot, params, target, children }: IBotScheduleListProviderProps): React.ReactNode => {
    const [copiedForm, setCopiedForm] = useState<IBotScheduleFormMap | undefined>(undefined);
    const [isAddMode, setIsAddMode] = useState(false);

    useEffect(() => {
        if (!isAddMode) {
            setCopiedForm(undefined);
        }
    }, [isAddMode, setCopiedForm]);

    return (
        <BotScheduleListContext.Provider
            value={{
                bot,
                params,
                target,
                copiedForm,
                setCopiedForm,
                isAddMode,
                setIsAddMode,
            }}
        >
            {children}
        </BotScheduleListContext.Provider>
    );
};

export const useBotScheduleList = () => {
    const context = useContext(BotScheduleListContext);
    if (!context) {
        throw new Error("useBotScheduleList must be used within an BotScheduleListProvider");
    }
    return context;
};
