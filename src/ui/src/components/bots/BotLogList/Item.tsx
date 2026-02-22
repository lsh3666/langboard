import { Badge, Box, Button, Collapsible, Flex, IconComponent } from "@/components/base";
import DateDistance from "@/components/DateDistance";
import { BotLogModel } from "@/core/models";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface IBotLogListItemProps {
    log: BotLogModel.TModel;
}

function BotLogListItem({ log }: IBotLogListItemProps) {
    const [t] = useTranslation();
    const logType = log.useField("log_type");
    const logStack = log.useField("message_stack");
    const updatedAt = log.useField("updated_at");
    const badgeVariant = useMemo(() => log.getBadgeVariant(), [logType]);

    return (
        <Collapsible.Root className="border-b">
            <Collapsible.Trigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-between truncate rounded-none [&[data-state=open]>:last-child]:rotate-180"
                >
                    {logStack.length > 0 ? (
                        <BotLogListItemStack log={log} stack={logStack.at(-1)!} />
                    ) : (
                        <Flex items="center" gap="2">
                            <Badge variant="outline">
                                <DateDistance date={updatedAt} />
                            </Badge>
                            <Badge variant={badgeVariant}>{t(`bot.logs.types.${logType}`)}</Badge>
                        </Flex>
                    )}
                    <IconComponent icon="chevron-down" size="4" className="transition-all" />
                </Button>
            </Collapsible.Trigger>
            <Collapsible.Content
                className={"overflow-hidden p-2 pl-6 data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"}
            >
                <Flex direction="col" gap="2">
                    {logStack.map((stack, i) => (
                        <BotLogListItemStack log={log} stack={stack} key={`log-stack-${log.uid}-${i}`} />
                    ))}
                </Flex>
            </Collapsible.Content>
        </Collapsible.Root>
    );
}

interface IBotLogListItemStackProps extends IBotLogListItemProps {
    stack: BotLogModel.ILogMessageStack;
}

function BotLogListItemStack({ log, stack }: IBotLogListItemStackProps) {
    const [t] = useTranslation();

    return (
        <Flex items="start" gap="2">
            <Flex items="center" gap="1">
                <Badge variant="outline">
                    <DateDistance date={stack.log_date} />
                </Badge>
                <Badge variant={log.getBadgeVariant(stack.log_type)}>{t(`bot.logs.types.${stack.log_type}`)}</Badge>
            </Flex>
            <Box textSize="sm" className="whitespace-break-spaces">
                {stack.message}
            </Box>
        </Flex>
    );
}

export default BotLogListItem;
