import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Input from "@/components/base/Input";
import Toast from "@/components/base/Toast";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { BotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { SettingRole } from "@/core/models/roles";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EHttpStatus } from "@langboard/core/enums";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const BotUniqueName = memo(() => {
    const [t] = useTranslation();
    const { model: bot } = ModelRegistry.BotModel.useContext();
    const navigate = usePageNavigateRef();
    const { currentUser } = useAppSetting();
    const settingRoleActions = currentUser.useField("setting_role_actions");
    const { hasRoleAction } = useRoleActionFilter(settingRoleActions);
    const canUpdateBot = hasRoleAction(SettingRole.EAction.BotUpdate);
    const uname = bot.useField("bot_uname");
    const editorName = `${bot.uid}-bot-unique-name`;
    const { mutateAsync } = useUpdateBot(bot, { interceptToast: true });

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => canUpdateBot,
        valueType: "input",
        editorName,
        save: (value, endCallback) => {
            const promise = mutateAsync({
                bot_uname: value,
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
                    return t("successes.Bot unique name changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: uname.slice(BotModel.Model.BOT_UNAME_PREFIX.length),
    });

    return (
        <Flex items="center">
            {!isEditing ? (
                <Flex items="center" cursor={canUpdateBot ? "pointer" : "default"} w="full" textSize="base" onClick={() => changeMode("edit")}>
                    <Box as="span" className="max-w-[calc(100%_-_theme(spacing.6))] truncate">
                        @{uname}
                    </Box>
                    {canUpdateBot && <IconComponent icon="pencil" size="4" className="ml-2" />}
                </Flex>
            ) : (
                <>
                    <Box textSize="base">@{BotModel.Model.BOT_UNAME_PREFIX}</Box>
                    <Input
                        ref={valueRef}
                        className={cn(
                            "ml-0 h-6 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-base scrollbar-hide",
                            "focus-visible:border-b-primary focus-visible:ring-0"
                        )}
                        defaultValue={uname.slice(BotModel.Model.BOT_UNAME_PREFIX.length)}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onBlur={() => changeMode("view")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                changeMode("view");
                                return;
                            }
                        }}
                    />
                </>
            )}
        </Flex>
    );
});

export default BotUniqueName;
