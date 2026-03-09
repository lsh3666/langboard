import Box from "@/components/base/Box";
import Checkbox from "@/components/base/Checkbox";
import Label from "@/components/base/Label";
import Toast from "@/components/base/Toast";
import { useBotTriggerConditionList } from "@/components/bots/BotTriggerConditionList/Provider";
import useCreateBotScope from "@/controllers/api/shared/botScopes/useCreateBotScope";
import useToggleBotScopeTriggerCondition from "@/controllers/api/shared/botScopes/useToggleBotScopeTriggerCondition";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import * as BaseBotScopeModel from "@/core/models/botScopes/BaseBotScopeModel";
import { EBotTriggerCondition } from "@/core/models/botScopes/EBotTriggerCondition";
import { TBotScopeModel, TBotScopeModelName } from "@/core/models/ModelRegistry";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotTriggerConditionProps {
    category: string;
    conditionType: EBotTriggerCondition;
}

function BotTriggerCondition({ category, conditionType }: IBotTriggerConditionProps): React.JSX.Element {
    const { botScope } = useBotTriggerConditionList();

    if (!botScope) {
        return <BotTriggerConditionWithoutBotScope category={category} conditionType={conditionType} />;
    }

    return <BotTriggerConditionWithBotScope category={category} conditionType={conditionType} botScope={botScope} />;
}

function BotTriggerConditionWithoutBotScope({ category, conditionType }: IBotTriggerConditionProps) {
    const [t] = useTranslation();
    const { params, botUID } = useBotTriggerConditionList();
    const { mutateAsync: createBotScopeMutateAsync } = useCreateBotScope(
        {
            ...params,
            bot_uid: botUID,
        },
        { interceptToast: true }
    );
    const mutateAsync = (endCallback: () => void) => {
        const promise = createBotScopeMutateAsync({
            conditions: [conditionType],
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Bot trigger condition changed successfully.");
            },
            finally: () => {
                endCallback();
            },
        });
    };

    return <BotTriggerConditionCheckbox category={category} conditionType={conditionType} conditions={[]} mutateAsync={mutateAsync} />;
}

function BotTriggerConditionWithBotScope({
    category,
    conditionType,
    botScope,
}: IBotTriggerConditionProps & { botScope: TBotScopeModel<TBotScopeModelName> }) {
    const [t] = useTranslation();
    const conditions = (botScope as BaseBotScopeModel.TModel).useField("conditions");
    const { params } = useBotTriggerConditionList();
    const { mutateAsync: toggleBotScopeMutateAsync } = useToggleBotScopeTriggerCondition(
        {
            ...params,
            bot_scope_uid: botScope.uid,
        },
        { interceptToast: true }
    );
    const mutateAsync = (endCallback: () => void) => {
        const promise = toggleBotScopeMutateAsync({
            condition: conditionType,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Bot trigger condition changed successfully.");
            },
            finally: () => {
                endCallback();
            },
        });
    };

    return <BotTriggerConditionCheckbox category={category} conditionType={conditionType} conditions={conditions} mutateAsync={mutateAsync} />;
}

interface IBotTriggerConditionCheckboxProps extends IBotTriggerConditionProps {
    conditions: EBotTriggerCondition[];
    mutateAsync: (endCallback: () => void) => void;
}

function BotTriggerConditionCheckbox({ category, conditionType, conditions, mutateAsync }: IBotTriggerConditionCheckboxProps) {
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [isChecked, setIsChecked] = useState(conditions.includes(conditionType));
    const handleCheckedChange = useCallback(
        (checked: CheckedState) => {
            if (Utils.Type.isString(checked) || isValidating) {
                return;
            }

            mutateAsync(() => {
                setIsValidating(false);
            });
        },
        [isValidating, setIsValidating]
    );

    useEffect(() => {
        setIsChecked(conditions.includes(conditionType));
    }, [conditions]);

    return (
        <Label
            display="flex"
            items="center"
            gap="3"
            p="2"
            cursor={isValidating ? "not-allowed" : "pointer"}
            className={cn("transition-all", isValidating ? "opacity-70" : "hover:text-foreground/70")}
        >
            <Checkbox checked={isChecked} onCheckedChange={handleCheckedChange} disabled={isValidating} />
            <Box>{t(`botTriggerCondition.${category}.conditions.${conditionType}`)}</Box>
        </Label>
    );
}

export default BotTriggerCondition;
