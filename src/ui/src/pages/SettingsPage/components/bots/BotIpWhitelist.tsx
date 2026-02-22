import { Checkbox, Flex, Label, Toast } from "@/components/base";
import MultiSelect from "@/components/MultiSelect";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { Utils } from "@langboard/core/utils";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BotModel } from "@/core/models";

const BotIpWhitelist = memo(() => {
    const [t] = useTranslation();
    const { model: bot } = ModelRegistry.BotModel.useContext();
    const navigate = usePageNavigateRef();
    const rawIpWhitelist = bot.useField("ip_whitelist");
    const ipWhitelist = useMemo(() => rawIpWhitelist.filter((ip) => ip !== BotModel.ALLOWED_ALL_IPS), [rawIpWhitelist]);
    const [isValidating, setIsValidating] = useState(false);
    const isAllAllowed = useMemo(() => rawIpWhitelist.includes(BotModel.ALLOWED_ALL_IPS), [rawIpWhitelist]);
    const { mutateAsync } = useUpdateBot(bot, { interceptToast: true });
    const updateBot = (values: string[]) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            ip_whitelist: values,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Bot IP whitelist changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Flex items="center" gap="2">
            <MultiSelect
                selections={[]}
                placeholder={t("settings.Add a new IP address or range (e.g. 192.0.0.1 or 192.0.0.0/24)...")}
                selectedValue={isAllAllowed ? [] : ipWhitelist}
                onValueChange={updateBot}
                className="w-[calc(100%_-_theme(spacing.24))]"
                inputClassName="ml-1 placeholder:text-gray-500 placeholder:font-medium"
                canCreateNew
                validateCreatedNewValue={Utils.String.isValidIpv4OrRange}
                createNewCommandItemLabel={(value) => {
                    const newIPs: string[] = [];

                    if (value.includes("/24")) {
                        newIPs.push(value, value.replace("/24", ""));
                    } else {
                        newIPs.push(value, `${value}/24`);
                    }

                    return newIPs.map((ip) => ({
                        label: ip,
                        value: ip,
                    }));
                }}
                isNewCommandItemMultiple
                disabled={isValidating || isAllAllowed}
            />
            <Label display="flex" items="center" gap="1.5" w="20" mb="2" cursor="pointer">
                <Checkbox
                    checked={isAllAllowed}
                    onCheckedChange={(checked) => {
                        if (Utils.Type.isString(checked)) {
                            return;
                        }

                        if (checked) {
                            updateBot([BotModel.ALLOWED_ALL_IPS]);
                        } else {
                            updateBot([]);
                        }
                    }}
                />
                {t("settings.Allow all")}
            </Label>
        </Flex>
    );
});

export default BotIpWhitelist;
