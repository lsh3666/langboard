import { Button, Flex, IconComponent, Toast } from "@/components/base";
import useGetInternalBots from "@/controllers/api/settings/internalBots/useGetInternalBots";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { InternalBotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import InternalBotDetails from "@/pages/SettingsPage/components/internalBots/InternalBotDetails";
import InternalBotList from "@/pages/SettingsPage/components/internalBots/InternalBotList";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

function InternalBotsPage() {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { isValidating } = useAppSetting();
    const { botUID } = useParams();
    const [bot, setBot] = useState<InternalBotModel.TModel | null>(null);
    const { mutateAsync: getInternalBotsMutateAsync } = useGetInternalBots();

    useEffect(() => {
        if (!botUID) {
            setPageAliasRef.current("Internal Bots");
            setBot(null);
            getInternalBotsMutateAsync({});
            return;
        }

        const targetBot = InternalBotModel.Model.getModel(botUID);
        if (!targetBot) {
            Toast.Add.error(t("errors.requests.NF3004"));
            navigate(ROUTES.SETTINGS.INTERNAL_BOTS);
            return;
        }

        setBot(targetBot);
    }, [botUID]);

    const openCreateDialog = () => {
        navigate(ROUTES.SETTINGS.CREATE_INTERNAL_BOT);
    };

    return (
        <>
            {bot ? (
                <InternalBotDetails internalBot={bot} />
            ) : (
                <>
                    <Flex justify="between" mb="4" pb="2" textSize="3xl" weight="semibold" className="scroll-m-20 border-b tracking-tight">
                        <span className="max-w-72 truncate">{t("settings.Internal bots")}</span>
                        <Button variant="outline" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={openCreateDialog}>
                            <IconComponent icon="plus" size="4" />
                            {t("settings.Add new")}
                        </Button>
                    </Flex>
                    <InternalBotList />
                </>
            )}
        </>
    );
}

export default InternalBotsPage;
