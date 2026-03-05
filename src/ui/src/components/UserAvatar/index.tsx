/* eslint-disable @/max-len */
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import React, { forwardRef, memo } from "react";
import { Avatar, Box, Card, Flex, IconComponent, Popover, Separator } from "@/components/base";
import { BotModel, User } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import { HOVER_USER_UID_ATTR, UserAvatarProvider, useUserAvatar } from "@/components/UserAvatar/Provider";
import UserAvatarTrigger, { TriggerVariants } from "@/components/UserAvatar/Trigger";
import { IUserAvatarProps } from "@/components/UserAvatar/types";
import UserLikeComponent from "@/components/UserLikeComponent";

const Root = memo(({ userOrBot, customTrigger, ...props }: IUserAvatarProps): React.JSX.Element => {
    let trigger;
    if (customTrigger) {
        trigger = customTrigger;
    } else {
        trigger = <UserAvatarTrigger {...props} userOrBot={userOrBot} />;
    }

    return (
        <UserAvatarProvider userOrBot={userOrBot} {...props}>
            <UserLikeComponent userOrBot={userOrBot} userComp={UserRoot} botComp={BotRoot} props={{ ...props, trigger }} />
        </UserAvatarProvider>
    );
});

interface IUserAvatarRootProps extends Omit<IUserAvatarProps, "userOrBot" | "customTrigger"> {
    trigger: React.ReactNode;
}

function UserRoot(props: IUserAvatarRootProps & { user: User.TModel }) {
    const { user, children, listAlign, trigger, onlyAvatar } = props;
    const userType = user.useField("type");
    const firstname = user.useField("firstname");
    const lastname = user.useField("lastname");
    const username = user.useField("username");
    const userAvatar = user.useField("avatar");
    const initials = Utils.String.getInitials(firstname, lastname);
    const isDeletedUser = user.isDeletedUser(userType);
    const isPresentableUnknownUser = user.isPresentableUnknownUser(userType);

    if (onlyAvatar || !children || isDeletedUser) {
        return <>{trigger}</>;
    }

    return (
        <HoverableRoot
            userOrBotUID={user.uid}
            trigger={trigger}
            initials={initials}
            listAlign={listAlign}
            avatarUrl={userAvatar}
            avatarFallback={isPresentableUnknownUser ? <IconComponent icon="user" className="size-[80%]" /> : initials}
            cardTitle={
                <Card.Title className={cn("ml-24 pt-6", isPresentableUnknownUser ? "pt-10" : "")}>
                    {firstname} {lastname}
                    {!isPresentableUnknownUser ? <Card.Description className="mt-1 text-muted-foreground">@{username}</Card.Description> : null}
                </Card.Title>
            }
        >
            {!isPresentableUnknownUser && children}
        </HoverableRoot>
    );
}

function BotRoot(props: IUserAvatarRootProps & { bot: BotModel.TModel }) {
    const { bot, children, listAlign, trigger, onlyAvatar } = props;
    const botName = bot.useField("name");
    const botUName = bot.useField("bot_uname");
    const botAvatar = bot.useField("avatar");
    const initials = Utils.String.getInitials(botName);

    if (onlyAvatar || !children) {
        return <>{trigger}</>;
    }

    return (
        <HoverableRoot
            userOrBotUID={bot.uid}
            trigger={trigger}
            initials={initials}
            listAlign={listAlign}
            avatarUrl={botAvatar}
            avatarFallback={<IconComponent icon="bot" className="size-[80%]" />}
            cardTitle={
                <Card.Title className="ml-24 pt-6">
                    {botName}
                    <Card.Description className="mt-1 text-muted-foreground">@{botUName}</Card.Description>
                </Card.Title>
            }
        >
            {children}
        </HoverableRoot>
    );
}

interface IHoverableRootProps {
    userOrBotUID: string;
    trigger: React.ReactNode;
    initials: string;
    listAlign?: "center" | "start" | "end";
    avatarUrl?: string;
    avatarFallback: React.ReactNode;
    cardTitle: React.ReactNode;
    children: React.ReactNode;
}

function HoverableRoot({ userOrBotUID, trigger, initials, listAlign, avatarUrl, avatarFallback, cardTitle, children }: IHoverableRootProps) {
    const { isOpened, hoverProps, setIsOpened, onPointerEnter, onPointerLeave, getAvatarHoverCardAttrs } = useUserAvatar();
    const [bgColor, textColor] = new Utils.Color.Generator(initials).generateAvatarColor();

    const hoverAttrs = {
        ...getAvatarHoverCardAttrs(),
        ...hoverProps,
    };

    const styles: Record<string, string> = {
        "--avatar-bg": bgColor,
        "--avatar-text-color": textColor,
    };

    return (
        <Popover.Root open={isOpened} onOpenChange={setIsOpened} {...hoverAttrs}>
            <Popover.Trigger onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} asChild>
                <span {...{ [HOVER_USER_UID_ATTR]: userOrBotUID }}>{trigger}</span>
            </Popover.Trigger>
            <Popover.Content
                className="z-[100] w-60 border-none bg-background p-0 shadow-none xs:w-72"
                align={listAlign}
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
                {...hoverAttrs}
            >
                <Card.Root className="relative shadow-md shadow-black/30 dark:shadow-border/40">
                    <Box position="absolute" left="0" top="0" h="24" w="full" className="rounded-t-lg bg-primary/50" />
                    <Card.Header className="relative space-y-0 bg-transparent pb-0">
                        <Avatar.Root className="absolute top-10 border" size="2xl">
                            <Avatar.Image src={avatarUrl} />
                            <Avatar.Fallback className="bg-[--avatar-bg] font-semibold text-[--avatar-text-color]" style={styles}>
                                {avatarFallback}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        {cardTitle}
                    </Card.Header>
                    <Card.Content className="px-0 pt-8">{children}</Card.Content>
                </Card.Root>
            </Popover.Content>
        </Popover.Root>
    );
}

const List = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    return (
        <Box w="full" mt="2" className={className} ref={ref} {...props}>
            {children}
        </Box>
    );
});

const ListLabel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    return (
        <Box px="5" py="2" textSize="sm" weight="semibold" className={className} ref={ref} {...props}>
            {children}
        </Box>
    );
});

const ListItem = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Flex>>(({ children, className, ...props }, ref) => {
    return (
        <Flex
            items="center"
            px="5"
            py="2"
            textSize="sm"
            position="relative"
            cursor="default"
            className={cn(
                "cursor-pointer select-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        >
            {children}
        </Flex>
    );
});

const ListSeparator = forwardRef<React.ComponentRef<typeof SeparatorPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>>(
    ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
        return <Separator ref={ref} {...props} />;
    }
);

export default { Root, List, ListLabel, ListItem, ListSeparator, TriggerVariants };
