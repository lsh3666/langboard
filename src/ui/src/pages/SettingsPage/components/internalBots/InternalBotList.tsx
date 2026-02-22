import { PillList } from "@/components/base";
import { InternalBotModel } from "@/core/models";
import InternalBot from "@/pages/SettingsPage/components/internalBots/InternalBot";

function InternalBotList() {
    const internalBots = InternalBotModel.Model.useModels(() => true);

    return (
        <PillList.Root>
            {internalBots.map((internalBot) => (
                <InternalBot key={internalBot.uid} data-id={internalBot.uid} internalBot={internalBot} />
            ))}
        </PillList.Root>
    );
}

export default InternalBotList;
