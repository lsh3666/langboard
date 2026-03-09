import Box from "@/components/base/Box";
import Card from "@/components/base/Card";
import Textarea from "@/components/base/Textarea";
import Toast from "@/components/base/Toast";
import useChangeUserGroupName from "@/controllers/api/account/useChangeUserGroupName";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { UserGroup } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IAccountUserGroupNameProps {
    group: UserGroup.TModel;
}

const AccountUserGroupName = memo(({ group }: IAccountUserGroupNameProps) => {
    const [t] = useTranslation();
    const groupName = group.useField("name");
    const editorName = `${group.uid}-group-name`;
    const { mutateAsync } = useChangeUserGroupName(group, { interceptToast: true });

    const { valueRef, height, isEditing, updateHeight, changeMode } = useChangeEditMode({
        canEdit: () => true,
        valueType: "textarea",
        editorName,
        save: (value, endCallback) => {
            const promise = mutateAsync({
                name: value,
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
                    return t("successes.User group name changed successfully.");
                },
                finally: () => {
                    endCallback();
                },
            });
        },
        originalValue: groupName,
    });

    return (
        <Card.Title className="w-[calc(100%_-_theme(spacing.6))]">
            {!isEditing ? (
                <Box cursor="text" minH="6" className="break-all border-b border-input" onClick={() => changeMode("edit")}>
                    {groupName}
                </Box>
            ) : (
                <Textarea
                    ref={valueRef}
                    className={cn(
                        "min-h-6 break-all rounded-none border-x-0 border-t-0 p-0 text-base scrollbar-hide",
                        "font-semibold leading-none tracking-tight focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    resize="none"
                    style={{ height }}
                    defaultValue={groupName}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onBlur={() => changeMode("view")}
                    onChange={updateHeight}
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
        </Card.Title>
    );
});

export default AccountUserGroupName;
