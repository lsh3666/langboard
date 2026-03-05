import { IBaseProjectCardActivity, IProjectCardActivityHistory } from "@/core/models/activities/project.card.activity.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";
import { IUpdatedRelationshipsInActivityHistory } from "@/core/models/activities/base.type";

export interface IProjectCardRelationshipActivityHistory extends IProjectCardActivityHistory {}

export interface IBaseProjectCardRelationshipActivity<
    THistory extends IProjectCardRelationshipActivityHistory,
> extends IBaseProjectCardActivity<THistory> {}

export interface IProjectCardRelationshipsUpdatedActivity extends IBaseProjectCardRelationshipActivity<
    IProjectCardRelationshipActivityHistory & IUpdatedRelationshipsInActivityHistory
> {
    activity_type: EProjectActivityType.CardRelationshipsUpdated;
}

export type TProjectCardRelationshipActivityInterface = IProjectCardRelationshipsUpdatedActivity;
