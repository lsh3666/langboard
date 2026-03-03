import { Box, Flex, IconComponent, Input, Toast } from "@/components/base";
import useUpdateUserInSettings from "@/controllers/api/settings/users/useUpdateUserInSettings";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { User } from "@/core/models";
import { SettingRole } from "@/core/models/roles";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EHttpStatus } from "@langboard/core/enums";
import { useTranslation } from "react-i18next";

function UserLastname({ user }: { user: User.TModel }) {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { currentUser } = useAppSetting();
    const settingRoleActions = currentUser.useField("setting_role_actions");
    const { hasRoleAction } = useRoleActionFilter(settingRoleActions);
    const canUpdateUser = hasRoleAction(SettingRole.EAction.UserUpdate);
    const lastname = user.useField("lastname");
    const editorName = `${user.uid}-user-lastname`;
    const { mutateAsync } = useUpdateUserInSettings(user, { interceptToast: true });

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => canUpdateUser,
        valueType: "input",
        editorName,
        save: (value, endCallback) => {
            const promise = mutateAsync({
                lastname: value,
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
                    return t("successes.User last name changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: lastname,
    });

    return (
        <Box className={cn("truncate text-center", isEditing && "pb-2.5 pt-[calc(theme(spacing.4)_-_2px)]")}>
            {!isEditing ? (
                <Flex cursor="pointer" justify="center" items="center" gap="1" position="relative" onClick={() => changeMode("edit")}>
                    <Box as="span" className="max-w-[calc(100%_-_theme(spacing.6))] truncate">
                        {lastname}
                    </Box>
                    <Box position="relative">
                        <Box position="absolute" left="2" className="top-1/2 -translate-y-1/2">
                            <IconComponent icon="pencil" size="4" />
                        </Box>
                    </Box>
                </Flex>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-6 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-center scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    defaultValue={lastname}
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
            )}
        </Box>
    );
}

export default UserLastname;
