import Flex from "@/components/base/Flex";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import AccountUserGroup, { SkeletonAccountUserGroup } from "@/pages/AccountPage/components/group/AccountUserGroup";
import AccountUserGroupAddButton from "@/pages/AccountPage/components/group/AccountUserGroupAddButton";

export function SkeletonAccountUserGroupList(): React.JSX.Element {
    return (
        <Flex direction="col" gap="5">
            <SkeletonAccountUserGroup />
            <SkeletonAccountUserGroup />
        </Flex>
    );
}

function AccountUserGroupList(): React.JSX.Element {
    const { currentUser } = useAccountSetting();
    const groups = currentUser.useForeignFieldArray("user_groups");

    return (
        <Flex direction="col" gap="5">
            {groups.map((group) => (
                <AccountUserGroup key={`account-user-group-${group.uid}`} group={group} />
            ))}
            <AccountUserGroupAddButton />
        </Flex>
    );
}

export default AccountUserGroupList;
