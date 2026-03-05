import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultViewActivitiesAction from "@/components/UserAvatarDefaultList/actions/ViewActivitiesAction";
import { IUserAvatarDefaultListContext, useUserAvatarDefaultList } from "@/components/UserAvatarDefaultList/Provider";
import { Project } from "@/core/models";

function UserAvatarDefaultBotList(): React.JSX.Element {
    const { scopeModels, currentUser } = useUserAvatarDefaultList();

    return (
        <>
            {scopeModels?.project && (
                <>
                    <UserAvatarDefaultViewActivitiesAction
                        scopeModels={scopeModels as Required<IUserAvatarDefaultListContext["scopeModels"]> & { project: Project.TModel }}
                        currentUser={currentUser}
                    />
                    <UserAvatar.ListSeparator />
                </>
            )}
        </>
    );
}

export default UserAvatarDefaultBotList;
