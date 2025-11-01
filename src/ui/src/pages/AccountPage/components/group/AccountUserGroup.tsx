import MultiSelectAssignee, { IFormProps, TSaveHandler } from "@/components/MultiSelectAssignee";
import { Box, Card, Flex, Skeleton, Toast } from "@/components/base";
import { EMAIL_REGEX } from "@/constants";
import useUpdateUserGroupAssignedEmails from "@/controllers/api/account/useUpdateUserGroupAssignedEmails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { User, UserGroup } from "@/core/models";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import AccountUserGroupDeleteButton from "@/pages/AccountPage/components/group/AccountUserGroupDeleteButton";
import AccountUserGroupName from "@/pages/AccountPage/components/group/AccountUserGroupName";
import { Utils } from "@langboard/core/utils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonAccountUserGroup(): JSX.Element {
    return (
        <Card.Root>
            <Card.Header className="relative">
                <Skeleton h="6" w="28" />
            </Card.Header>
            <Card.Content>
                <Flex gap="3" w="full" wrap rounded="md" border px="3" py="2" className="border-input">
                    <Skeleton w="24" className="h-[calc(theme(spacing.5)_+_2px)]" />
                    <Skeleton w="20" className="h-[calc(theme(spacing.5)_+_2px)]" />
                    <Skeleton w="32" className="h-[calc(theme(spacing.5)_+_2px)]" />
                </Flex>
                <Box p="1" />
            </Card.Content>
        </Card.Root>
    );
}

export interface IAccountUserGroupProps {
    group: UserGroup.TModel;
}

const AccountUserGroup = memo(({ group }: IAccountUserGroupProps): JSX.Element => {
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [readOnly, setReadOnly] = useState(true);
    const { currentUser } = useAccountSetting();
    const groups = currentUser.useForeignFieldArray("user_groups");
    const { mutate } = useUpdateUserGroupAssignedEmails(group);
    const users = group.useForeignFieldArray("users");

    const onSave = (values: (string | User.TModel)[]) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        mutate(
            {
                emails: values.map((u) => (Utils.Type.isString(u) ? u : u.email)),
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.User group emails updated successfully."));
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <Card.Root>
            <Card.Header className="relative">
                <AccountUserGroupName group={group} />
                <AccountUserGroupDeleteButton group={group} />
            </Card.Header>
            <Card.Content>
                <MultiSelectAssignee.Form
                    allSelectables={users}
                    originalAssignees={users}
                    createSearchKeywords={((item: User.TModel) => [item.email, item.firstname, item.lastname]) as IFormProps["createSearchKeywords"]}
                    createLabel={
                        ((item: User.TModel) =>
                            item.isValidUser() ? `${item.firstname} ${item.lastname}`.trim() : item.email) as IFormProps["createLabel"]
                    }
                    placeholder={t("myAccount.Add an email...")}
                    useEditorProps={{
                        canAddNew: true,
                        useButton: true,
                        validateNewItem: (value) => !!value && EMAIL_REGEX.test(value),
                        isValidating,
                        readOnly,
                        setReadOnly,
                        save: onSave as TSaveHandler,
                        withUserGroups: true,
                        groups: groups.filter((g) => g.uid !== group.uid),
                    }}
                />
            </Card.Content>
        </Card.Root>
    );
});

export default AccountUserGroup;
