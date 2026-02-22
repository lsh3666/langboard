import { PillList } from "@/components/base";
import { BotModel } from "@/core/models";
import Bot from "@/pages/SettingsPage/components/bots/Bot";

function BotList() {
    const bots = BotModel.Model.useModels(() => true);

    return (
        <PillList.Root>
            {bots.map((bot) => (
                <Bot key={bot.uid} data-id={bot.uid} bot={bot} />
            ))}
        </PillList.Root>
    );
}

export default BotList;
