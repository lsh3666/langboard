import { Button, Dialog, Drawer, Flex, ScrollArea } from "@/components/base";
import BotLogList from "@/components/bots/BotLogList";
import BotScheduleList from "@/components/bots/BotScheduleList";
import BotTriggerConditionList from "@/components/bots/BotTriggerConditionList";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useHandleInteractOutside from "@/core/hooks/useHandleInteractOutside";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { BotModel, Project, ProjectBotScope } from "@/core/models";
import { IBoardRelatedPageProps } from "@/pages/BoardPage/types";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardBotScopeProps extends IBoardRelatedPageProps {
    isOpened: bool;
    setIsOpened: (isOpened: bool) => void;
}

function BoardBotScope({ project, ...props }: IBoardBotScopeProps) {
    const currentUserRoleActions = project.useField("current_auth_role_actions");
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const canEdit = hasRoleAction(Project.ERoleAction.Update);

    if (!canEdit) {
        return null;
    }

    return <BoardBotScopeDisplay project={project} {...props} />;
}

function BoardBotScopeDisplay({ project, isOpened, setIsOpened }: IBoardBotScopeProps) {
    const bots = BotModel.Model.useModels(() => true);
    const { onInteractOutside, onPointerDownOutside } = useHandleInteractOutside({ pointerDownOutside: () => setIsOpened(false) }, [setIsOpened]);

    return (
        <Drawer.Root open={isOpened} onOpenChange={setIsOpened}>
            <Drawer.Content
                focusGuards={false}
                onInteractOutside={onInteractOutside}
                onPointerDownOutside={onPointerDownOutside}
                {...{ [DISABLE_DRAGGING_ATTR]: "" }}
            >
                <Drawer.Title hidden />
                <Drawer.Description hidden />
                <ScrollArea.Root className="py-1">
                    <Flex direction="col" gap="2" px="2.5" className="max-h-[50vh]">
                        {bots.map((bot) => (
                            <BoardBotScopeItem key={bot.uid} bot={bot} project={project} />
                        ))}
                    </Flex>
                </ScrollArea.Root>
            </Drawer.Content>
        </Drawer.Root>
    );
}
BoardBotScopeDisplay.displayName = "Board.BotScopeDisplay";

interface IBoardBotScopeItemProps {
    project: Project.TModel;
    bot: BotModel.TModel;
}

const BoardBotScopeItem = memo(({ bot, project }: IBoardBotScopeItemProps) => {
    const botScopes = ProjectBotScope.Model.useModels((model) => model.bot_uid === bot.uid && model.project_uid === project.uid);
    const botScope = botScopes[0];

    return (
        <Flex items="center" justify="between" gap="3">
            <UserAvatar.Root
                userOrBot={bot}
                avatarSize="xs"
                withNameProps={{ className: "inline-flex gap-1 select-none", nameClassName: "text-base" }}
            >
                <UserAvatarDefaultList
                    userOrBot={bot}
                    scope={{
                        projectUID: project.uid,
                    }}
                />
            </UserAvatar.Root>

            <Flex items="center" gap="1">
                <BoardBotScopeItemDialog title="bot.Triggers">
                    <BotTriggerConditionList
                        params={{
                            target_table: "project",
                            target_uid: project.uid,
                            bot_uid: bot.uid,
                        }}
                        botUID={bot.uid}
                        botScope={botScope}
                    />
                </BoardBotScopeItemDialog>
                <BoardBotScopeItemDialog title="bot.Schedules">
                    <BotScheduleList
                        bot={bot}
                        params={{
                            target_table: "project",
                            bot_uid: bot.uid,
                        }}
                        target={project}
                    />
                </BoardBotScopeItemDialog>
                <BoardBotScopeItemDialog title="bot.Logs">
                    <BotLogList
                        bot={bot}
                        params={{
                            target_table: "project",
                        }}
                        target={project}
                    />
                </BoardBotScopeItemDialog>
            </Flex>
        </Flex>
    );
});

function BoardBotScopeItemDialog({ title, children }: { title: string; children: React.ReactNode }) {
    const [t] = useTranslation();

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button size="sm">{t(title)}</Button>
            </Dialog.Trigger>
            <Dialog.Content className="p-2 pt-8 sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg" aria-describedby="">
                <Dialog.Title hidden />
                {children}
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default BoardBotScope;
