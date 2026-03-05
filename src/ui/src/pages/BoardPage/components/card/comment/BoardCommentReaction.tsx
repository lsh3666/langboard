import ReactionCounter, { TReactionEmoji } from "@/components/ReactionCounter";
import useReactCardComment from "@/controllers/api/card/comment/useReactCardComment";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectCardComment } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";

export interface IBoardCommentReactionProps {
    comment: ProjectCardComment.TModel;
}

const BoardCommentReaction = ({ comment }: IBoardCommentReactionProps): React.JSX.Element => {
    const { projectUID, card, currentUser } = useBoardCard();
    const reactions = comment.useField("reactions");
    const { mutate: reactCardCommentMutate } = useReactCardComment();
    const [isValidating, setIsValidating] = useState(false);

    const submitToggleReaction = (reaction: TReactionEmoji) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        reactCardCommentMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                comment_uid: comment.uid,
                reaction,
            },
            {
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <ReactionCounter
            reactions={reactions}
            isActiveReaction={(_, data) => {
                return data.includes(currentUser.uid);
            }}
            toggleCallback={submitToggleReaction}
            disabled={isValidating}
        />
    );
};

export default BoardCommentReaction;
