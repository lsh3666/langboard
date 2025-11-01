import { Button, Dialog, Flex, ScrollArea } from "@/components/base";
import BotLogList from "@/components/bots/BotLogList";
import BotScheduleList from "@/components/bots/BotScheduleList";
import BotTriggerConditionList from "@/components/bots/BotTriggerConditionList";
import MoreMenu from "@/components/MoreMenu";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import { BotModel, ProjectColumn, ProjectColumnBotScope } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const BoardColumnMoreMenuBotScope = memo(({ column }: { column: ProjectColumn.TModel }) => {
    const [t] = useTranslation();
    const bots = BotModel.Model.useModels(() => true);

    return (
        <MoreMenu.DrawerItem
            contentProps={{ [DISABLE_DRAGGING_ATTR]: "" } as React.ComponentProps<typeof MoreMenu.DrawerItem>["contentProps"]}
            menuName={t("bot.Scope bot")}
            useButtons={false}
        >
            <ScrollArea.Root className="py-1">
                <Flex direction="col" gap="2" px="2.5" className="max-h-[50vh]">
                    {bots.map((bot) => (
                        <BoardColumnMoreMenuBotScopeItem key={bot.uid} bot={bot} column={column} />
                    ))}
                </Flex>
            </ScrollArea.Root>
        </MoreMenu.DrawerItem>
    );
});
BoardColumnMoreMenuBotScope.displayName = "Board.ColumnMoreMenuBotScope";

interface IBoardColumnMoreMenuBotScopeItemProps {
    bot: BotModel.TModel;
    column: ProjectColumn.TModel;
}

const BoardColumnMoreMenuBotScopeItem = memo(({ bot, column }: IBoardColumnMoreMenuBotScopeItemProps) => {
    const { project } = useBoard();
    const botScope = ProjectColumnBotScope.Model.useModel(
        (model) => model.bot_uid === bot.uid && model.project_column_uid === column.uid,
        [bot, column]
    );

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
                        columnUID: column.uid,
                    }}
                />
            </UserAvatar.Root>

            <Flex items="center" gap="1">
                <BoardColumnMoreMenuBotScopeItemDialog title="bot.Triggers">
                    <BotTriggerConditionList
                        params={{
                            target_table: "project_column",
                            target_uid: column.uid,
                            bot_uid: bot.uid,
                        }}
                        botUID={bot.uid}
                        botScope={botScope}
                    />
                </BoardColumnMoreMenuBotScopeItemDialog>
                <BoardColumnMoreMenuBotScopeItemDialog title="bot.Schedules">
                    <BotScheduleList
                        bot={bot}
                        params={{
                            target_table: "project_column",
                            bot_uid: bot.uid,
                        }}
                        target={column}
                    />
                </BoardColumnMoreMenuBotScopeItemDialog>
                <BoardColumnMoreMenuBotScopeItemDialog title="bot.Logs">
                    <BotLogList
                        bot={bot}
                        params={{
                            target_table: "project_column",
                        }}
                        target={column}
                    />
                </BoardColumnMoreMenuBotScopeItemDialog>
            </Flex>
        </Flex>
    );
});

function BoardColumnMoreMenuBotScopeItemDialog({ title, children }: { title: string; children: React.ReactNode }) {
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

export default BoardColumnMoreMenuBotScope;
