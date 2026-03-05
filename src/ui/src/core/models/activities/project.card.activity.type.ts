import { IBaseModel } from "@/core/models/Base";
import { IBaseProjectActivity } from "@/core/models/activities/project.activity.type";
import { IProjectColumnActivityHistory } from "@/core/models/activities/project.column.activity.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";
import {
    IChangesInActivityHistory,
    IUpdatedAssignedUsersInActivityHistory,
    IUpdatedLabelsInActivityHistory,
} from "@/core/models/activities/base.type";

export interface IProjectCardActivityHistory extends IProjectColumnActivityHistory {
    card: {
        title: string;
        is_deleted?: bool;
    };
}

export interface IBaseProjectCardActivity<THistory extends IProjectCardActivityHistory> extends IBaseProjectActivity<THistory> {
    filterable_map: IBaseProjectActivity<THistory>["filterable_map"] & {
        card: string;
    };
    references: {
        project: IBaseModel;
        card: IBaseModel;
    };
}

export interface IProjectCardCreatedActivity extends IBaseProjectCardActivity<IProjectCardActivityHistory> {
    activity_type: EProjectActivityType.CardCreated;
}
export interface IProjectCardUpdatedActivity extends IBaseProjectCardActivity<IProjectCardActivityHistory & Required<IChangesInActivityHistory>> {
    activity_type: EProjectActivityType.CardUpdated;
}
export interface IProjectCardMovedActivity extends IBaseProjectCardActivity<IProjectCardActivityHistory & { from_column: { name: string } }> {
    activity_type: EProjectActivityType.CardMoved;
}
export interface IProjectCardAssignedUsersUpdatedActivity extends IBaseProjectCardActivity<
    IProjectCardActivityHistory & IUpdatedAssignedUsersInActivityHistory
> {
    activity_type: EProjectActivityType.CardAssignedUsersUpdated;
}
export interface IProjectCardLabelsUpdatedActivity extends IBaseProjectCardActivity<IProjectCardActivityHistory & IUpdatedLabelsInActivityHistory> {
    activity_type: EProjectActivityType.CardLabelsUpdated;
}
export interface IProjectCardDeletedActivity extends IBaseProjectCardActivity<IProjectCardActivityHistory> {
    activity_type: EProjectActivityType.CardDeleted;
}

export type TProjectCardActivityInterface =
    | IProjectCardCreatedActivity
    | IProjectCardUpdatedActivity
    | IProjectCardMovedActivity
    | IProjectCardAssignedUsersUpdatedActivity
    | IProjectCardLabelsUpdatedActivity
    | IProjectCardDeletedActivity;
