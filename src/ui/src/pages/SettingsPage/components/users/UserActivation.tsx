import { Checkbox, Flex, Toast, Tooltip } from "@/components/base";
import useUpdateUserInSettings from "@/controllers/api/settings/users/useUpdateUserInSettings";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { User } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function UserActivation({ user }: { user: User.TModel }) {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const rawActivatedAt = user.useField("activated_at");
    const activatedAt = useUpdateDateDistance(rawActivatedAt);
    const { mutateAsync } = useUpdateUserInSettings(user, { interceptToast: true });
    const [isValidating, setIsValidating] = useState(false);

    const toggle = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const activate = !rawActivatedAt;

        const promise = mutateAsync({
            activate,
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
                return t(`successes.User ${activate ? "activated" : "deactivated"} successfully.`);
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <Flex justify="center" w="full">
                    <Checkbox checked={!!rawActivatedAt} onClick={toggle} />
                </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom" align="center">
                {rawActivatedAt ? activatedAt : t("settings.Activate")}
            </Tooltip.Content>
        </Tooltip.Root>
    );
}

export default UserActivation;
