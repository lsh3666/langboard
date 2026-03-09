import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Input from "@/components/base/Input";
import Table from "@/components/base/Table";
import Toast from "@/components/base/Toast";
import useUpdateGlobalRelationship from "@/controllers/api/settings/relationships/useUpdateGlobalRelationship";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { SettingRole } from "@/core/models/roles";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EHttpStatus } from "@langboard/core/enums";
import { useTranslation } from "react-i18next";

function GlobalRelationshipChildName() {
    const { model: globalRelationship } = ModelRegistry.GlobalRelationshipType.useContext();
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { currentUser } = useAppSetting();
    const settingRoleActions = currentUser?.useField("setting_role_actions");
    const { hasRoleAction } = useRoleActionFilter(settingRoleActions);
    const canUpdateGlobalRelationship = hasRoleAction(SettingRole.EAction.GlobalRelationshipUpdate);
    const childName = globalRelationship.useField("child_name");
    const editorName = `${globalRelationship.uid}-global-relationship-child-name`;
    const { mutateAsync } = useUpdateGlobalRelationship(globalRelationship, { interceptToast: true });

    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => canUpdateGlobalRelationship,
        valueType: "input",
        editorName,
        save: (value, endCallback) => {
            const promise = mutateAsync({
                child_name: value,
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
                    return t("successes.Child name changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: childName,
    });

    return (
        <Table.FlexCell className={cn("w-1/6 truncate text-center", isEditing && "pb-2.5 pt-[calc(theme(spacing.4)_-_2px)]")}>
            {!isEditing ? (
                <Flex
                    cursor={canUpdateGlobalRelationship ? "pointer" : "default"}
                    justify="center"
                    items="center"
                    gap="1"
                    position="relative"
                    onClick={() => changeMode("edit")}
                >
                    <Box as="span" className="max-w-[calc(100%_-_theme(spacing.6))] truncate">
                        {childName}
                    </Box>
                    {canUpdateGlobalRelationship && (
                        <Box position="relative">
                            <Box position="absolute" left="2" className="top-1/2 -translate-y-1/2">
                                <IconComponent icon="pencil" size="4" />
                            </Box>
                        </Box>
                    )}
                </Flex>
            ) : (
                <Input
                    ref={valueRef}
                    className={cn(
                        "h-6 rounded-none border-x-0 border-t-0 bg-transparent p-0 text-center scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    defaultValue={childName}
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
        </Table.FlexCell>
    );
}

export default GlobalRelationshipChildName;
