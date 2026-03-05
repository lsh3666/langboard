import type { IMentionElement } from "@/components/Editor/plugins/markdown/mention";
import type { SlateElementProps } from "platejs/static";
import { IS_APPLE, KEYS } from "platejs";
import { SlateElement } from "platejs/static";
import { cn } from "@/core/utils/ComponentUtils";
import { User } from "@/core/models";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { useEditorData } from "@/core/providers/EditorDataProvider";
import { useCallback } from "react";
import { isModel } from "@/core/models/ModelRegistry";

export function MentionElementStatic(
    props: SlateElementProps<IMentionElement> & {
        prefix?: string;
    }
) {
    const { mentionables, form } = useEditorData();
    const element = props.element;
    const mentioned = mentionables.find((userOrBot) => userOrBot.uid === element.key) ?? User.Model.createUnknownUser();
    const renderLabel = useCallback(() => {
        const mentionable = mentionables.find((val) => val.uid === element.key);
        if (isModel(mentionable, "User")) {
            return `${mentionable.firstname} ${mentionable.lastname}`;
        } else if (isModel(mentionable, "BotModel")) {
            return mentionable.name;
        } else {
            return element.value;
        }
    }, [element, mentionables]);

    let customName;
    if (IS_APPLE) {
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        customName = (
            <>
                {props.children}
                {props.prefix}
                {renderLabel()}
            </>
        );
    } else {
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        customName = (
            <>
                {props.prefix}
                {renderLabel()}
                {props.children}
            </>
        );
    }

    return (
        <SlateElement
            className={cn(
                "inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium",
                element.children[0][KEYS.bold] === true && "font-bold",
                element.children[0][KEYS.italic] === true && "italic",
                element.children[0][KEYS.underline] === true && "underline"
            )}
            data-slate-value={element.value}
            {...props}
        >
            <UserAvatar.Root
                userOrBot={mentioned}
                withNameProps={{
                    noAvatar: true,
                    customName: customName,
                }}
            >
                <UserAvatarDefaultList
                    userOrBot={mentioned}
                    scope={{
                        projectUID: form?.project_uid,
                        cardUID: form?.card_uid,
                        wikiUID: form?.wiki_uid,
                    }}
                />
            </UserAvatar.Root>
        </SlateElement>
    );
}
