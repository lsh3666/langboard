import { IBaseProjectCardActivity, IProjectCardActivityHistory } from "@/core/models/activities/project.card.activity.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";
import { IChangesInActivityHistory } from "@/core/models/activities/base.type";

export interface IProjectCardChecklistActivityHistory extends IProjectCardActivityHistory {
    checklist: {
        title: string;
    };
}

export interface IProjectCardChecklistCreatedActivity extends IBaseProjectCardActivity<IProjectCardChecklistActivityHistory> {
    activity_type: EProjectActivityType.CardChecklistCreated;
}
export interface IProjectCardChecklistTitleChangedActivity extends IBaseProjectCardActivity<
    IProjectCardChecklistActivityHistory & IChangesInActivityHistory
> {
    activity_type: EProjectActivityType.CardChecklistTitleChanged;
}
export interface IProjectCardChecklistCheckedActivity extends IBaseProjectCardActivity<IProjectCardChecklistActivityHistory> {
    activity_type: EProjectActivityType.CardChecklistChecked;
}
export interface IProjectCardChecklistUncheckedActivity extends IBaseProjectCardActivity<IProjectCardChecklistActivityHistory> {
    activity_type: EProjectActivityType.CardChecklistUnchecked;
}
export interface IProjectCardChecklistDeletedActivity extends IBaseProjectCardActivity<IProjectCardChecklistActivityHistory> {
    activity_type: EProjectActivityType.CardChecklistDeleted;
}

export type TProjectCardChecklistActivityInterface =
    | IProjectCardChecklistCreatedActivity
    | IProjectCardChecklistTitleChangedActivity
    | IProjectCardChecklistCheckedActivity
    | IProjectCardChecklistUncheckedActivity
    | IProjectCardChecklistDeletedActivity;
