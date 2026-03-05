import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { User } from "@/core/models";
import { memo } from "react";

export interface IBoardCardCheckitemAssignedMemberProps {
    projectUID: string;
    cardUID: string;
    assignedUser: User.TModel;
}

const BoardCardCheckitemAssignedMember = memo(({ projectUID, cardUID, assignedUser }: IBoardCardCheckitemAssignedMemberProps): React.JSX.Element => {
    return (
        <UserAvatar.Root userOrBot={assignedUser} avatarSize="xs">
            <UserAvatarDefaultList
                userOrBot={assignedUser}
                scope={{
                    projectUID,
                    cardUID,
                }}
            />
        </UserAvatar.Root>
    );
});

export default BoardCardCheckitemAssignedMember;
