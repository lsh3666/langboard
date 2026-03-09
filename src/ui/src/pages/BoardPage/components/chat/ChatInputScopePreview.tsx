/* eslint-disable @typescript-eslint/no-explicit-any */
import Badge from "@/components/base/Badge";
import Flex from "@/components/base/Flex";
import Tooltip from "@/components/base/Tooltip";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { useMemo } from "react";
import { ProjectCard, ProjectColumn, ProjectWiki } from "@/core/models";
import { useTranslation } from "react-i18next";

export interface IChatInputScopePreviewProps {
    scope: ProjectCard.TModel | ProjectColumn.TModel | ProjectWiki.TModel;
}

function ChatInputScopePreview({ scope }: IChatInputScopePreviewProps) {
    const { selectedScope } = useBoardChat();
    const [t] = useTranslation();
    const [scopeField, scopeBadge] = useMemo(() => {
        const [scopeTable] = selectedScope || [undefined, undefined];
        switch (scopeTable) {
            case "card":
                return ["title", scopeTable];
            case "project_column":
                return ["name", scopeTable];
            case "project_wiki":
                return ["title", scopeTable];
            default:
                return ["uid", "Unknown"];
        }
    }, [selectedScope, scope]);
    const scopeName: string = (scope as any).useField(scopeField);

    return (
        <Flex direction="col" justify="center" items="center" gap="1" size="full">
            <Flex direction="col" items="center" justify="center" className="border-border text-center" w="full" h="20" border rounded="md">
                <Badge variant="secondary">{t(`project.chatScopes.${scopeBadge}`)}</Badge>
                <Tooltip.Root>
                    <Tooltip.Trigger>
                        <span className="w-[calc(100%_-_theme(spacing.4))] truncate">{scopeName}</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content align="center" side="top">
                        {scopeName}
                    </Tooltip.Content>
                </Tooltip.Root>
            </Flex>
        </Flex>
    );
}

export default ChatInputScopePreview;
