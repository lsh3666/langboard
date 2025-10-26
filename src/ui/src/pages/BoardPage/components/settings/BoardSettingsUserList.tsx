import { Flex } from "@/components/base";
import NotificationSetting from "@/components/NotificationSetting";
import { AuthUser, Project } from "@/core/models";
import BoardSettingsSection from "@/pages/BoardPage/components/settings/BoardSettingsSection";
import { memo } from "react";

export interface IBoardSettingsUserListProps {
    currentUser: AuthUser.TModel;
    project: Project.TModel;
}

const BoardSettingsUserList = memo(({ currentUser, project }: IBoardSettingsUserListProps) => {
    return (
        <Flex direction="col" gap="3" p={{ initial: "4", md: "6", lg: "8" }} items="center">
            <BoardSettingsSection title="notification.settings.Notification settings">
                <Flex items="center" justify="center" py="4">
                    <NotificationSetting.SpecificScopedPopover
                        type="project"
                        currentUser={currentUser}
                        form={{
                            project_uid: project.uid,
                        }}
                        specificUID={project.uid}
                    />
                </Flex>
            </BoardSettingsSection>
        </Flex>
    );
});

export default BoardSettingsUserList;
