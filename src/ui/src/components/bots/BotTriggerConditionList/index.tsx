import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import { useTranslation } from "react-i18next";
import { BotTriggerConditionListProvider, useBotTriggerConditionList } from "@/components/bots/BotTriggerConditionList/Provider";
import BotTriggerCondition from "@/components/bots/BotTriggerConditionList/Condition";
import { TBotScopeRelatedParams } from "@/controllers/api/shared/botScopes/types";
import { TBotScopeModel, TBotScopeModelName } from "@/core/models/ModelRegistry";

export interface IBotTriggerConditionListProps {
    params: TBotScopeRelatedParams;
    botUID: string;
    botScope?: TBotScopeModel<TBotScopeModelName>;
}

function BotTriggerConditionList({ params, botUID, botScope }: IBotTriggerConditionListProps) {
    return (
        <BotTriggerConditionListProvider params={params} botUID={botUID} botScope={botScope}>
            <BotTriggerConditionListDisplay />
        </BotTriggerConditionListProvider>
    );
}

function BotTriggerConditionListDisplay() {
    const [t] = useTranslation();
    const { categories } = useBotTriggerConditionList();

    return Object.keys(categories).map((category) => (
        <Flex direction="col" gap={{ initial: "1", md: "2" }} key={`bot-trigger-category-${category}`}>
            <Box>{t(`botTriggerCondition.${category}.Category`)}</Box>
            <BotTriggerConditionCategory category={category} />
        </Flex>
    ));
}

interface IBotTriggerConditionCategoryProps {
    category: string;
}

function BotTriggerConditionCategory({ category }: IBotTriggerConditionCategoryProps) {
    const { categories } = useBotTriggerConditionList();
    const conditions = categories[category];

    return (
        <Flex gap={{ initial: "1", md: "2" }} wrap>
            {conditions.map((condition) => (
                <BotTriggerCondition key={`bot-trigger-category-${category}-condition-${condition}`} category={category} conditionType={condition} />
            ))}
        </Flex>
    );
}

export default BotTriggerConditionList;
