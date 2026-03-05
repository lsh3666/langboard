import { IBaseProjectCardActivity, IProjectCardActivityHistory } from "@/core/models/activities/project.card.activity.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";
import { IBotInActivityHistory, IChangesInActivityHistory, IUserInActivityHistory } from "@/core/models/activities/base.type";
import { IEditorContent } from "@/core/models/Base";
import { TReactionEmoji } from "@/components/ReactionCounter";

interface ICommentInActivityHistory {
    content: IEditorContent;
    author: IBotInActivityHistory | IUserInActivityHistory;
}

export interface IProjectCardCommentActivityHistory extends IProjectCardActivityHistory {
    comment: ICommentInActivityHistory;
}

export interface IProjectCardCommentAddedActivity extends IBaseProjectCardActivity<IProjectCardCommentActivityHistory> {
    activity_type: EProjectActivityType.CardCommentAdded;
}
export interface IProjectCardCommentUpdatedActivity extends IBaseProjectCardActivity<IProjectCardCommentActivityHistory & IChangesInActivityHistory> {
    activity_type: EProjectActivityType.CardCommentUpdated;
}
export interface IProjectCardCommentDeletedActivity extends IBaseProjectCardActivity<IProjectCardCommentActivityHistory> {
    activity_type: EProjectActivityType.CardCommentDeleted;
}
export interface IProjectCardCommentReactedActivity extends IBaseProjectCardActivity<
    IProjectCardCommentActivityHistory & { reaction_type: TReactionEmoji }
> {
    activity_type: EProjectActivityType.CardCommentReacted;
}
export interface IProjectCardCommentUnreactedActivity extends IBaseProjectCardActivity<
    IProjectCardCommentActivityHistory & { reaction_type: TReactionEmoji }
> {
    activity_type: EProjectActivityType.CardCommentUnreacted;
}

export type TProjectCardCommentActivity =
    | IProjectCardCommentAddedActivity
    | IProjectCardCommentUpdatedActivity
    | IProjectCardCommentDeletedActivity
    | IProjectCardCommentReactedActivity
    | IProjectCardCommentUnreactedActivity;
