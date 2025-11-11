import { Button, Flex, IconComponent, Toast } from "@/components/base";
import useDeleteSelectedSettings from "@/controllers/api/settings/useDeleteSelectedSettings";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import WebhookList from "@/pages/SettingsPage/components/webhook/WebhookList";
import { EHttpStatus } from "@langboard/core/enums";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function WebhooksPage() {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { isValidating, setIsValidating } = useAppSetting();
    const [selectedWebhooks, setSelectedWebhooks] = useState<string[]>([]);
    const { mutate: deleteSelectedSettingsMutate } = useDeleteSelectedSettings();

    useEffect(() => {
        setPageAliasRef.current("Webhooks");
    }, []);

    const openCreateDialog = () => {
        navigate(ROUTES.SETTINGS.CREATE_WEBHOOK);
    };

    const deleteSelectedSettings = () => {
        if (isValidating || !selectedWebhooks.length) {
            return;
        }

        setIsValidating(true);

        deleteSelectedSettingsMutate(
            {
                setting_uids: selectedWebhooks,
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.Selected webhooks deleted successfully."));
                    setSelectedWebhooks([]);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <>
            <Flex
                justify={{ sm: "between" }}
                direction={{ initial: "col", sm: "row" }}
                gap="2"
                mb="4"
                pb="2"
                textSize="3xl"
                weight="semibold"
                className="scroll-m-20 tracking-tight"
            >
                <span className="w-36">{t("settings.Webhooks")}</span>
                <Flex gap="2" wrap justify="end" maxW={{ initial: "full", sm: "auto" }}>
                    {selectedWebhooks.length > 0 && (
                        <Button variant="destructive" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={deleteSelectedSettings}>
                            <IconComponent icon="trash" size="4" />
                            {t("common.Delete")}
                        </Button>
                    )}
                    <Button variant="outline" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={openCreateDialog}>
                        <IconComponent icon="plus" size="4" />
                        {t("settings.Add new")}
                    </Button>
                </Flex>
            </Flex>
            <WebhookList selectedWebhooks={selectedWebhooks} setSelectedWebhooks={setSelectedWebhooks} />
        </>
    );
}

export default WebhooksPage;
