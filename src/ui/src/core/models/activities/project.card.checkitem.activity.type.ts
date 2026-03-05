import { IBaseProjectCardActivity, IProjectCardActivityHistory } from "@/core/models/activities/project.card.activity.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";
import { IChangesInActivityHistory } from "@/core/models/activities/base.type";

export interface IProjectCardCheckitemActivityHistory extends IProjectCardActivityHistory {
    checkitem: {
        title: string;
    };
}

export interface IProjectCardCheckitemCreatedActivity extends IBaseProjectCardActivity<IProjectCardCheckitemActivityHistory> {
    activity_type: EProjectActivityType.CardCheckitemCreated;
}
export interface IProjectCardCheckitemTitleChangedActivity extends IBaseProjectCardActivity<
    IProjectCardCheckitemActivityHistory & IChangesInActivityHistory
> {
    activity_type: EProjectActivityType.CardCheckitemTitleChanged;
}
export interface IProjectCardCheckitemTimerStartedActivity extends IBaseProjectCardActivity<IProjectCardCheckitemActivityHistory> {
    activity_type: EProjectActivityType.CardCheckitemTimerStarted;
}
export interface IProjectCardCheckitemTimerPausedActivity extends IBaseProjectCardActivity<IProjectCardCheckitemActivityHistory> {
    activity_type: EProjectActivityType.CardCheckitemTimerPaused;
}
export interface IProjectCardCheckitemTimerStoppedActivity extends IBaseProjectCardActivity<IProjectCardCheckitemActivityHistory> {
    activity_type: EProjectActivityType.CardCheckitemTimerStopped;
}
export interface IProjectCardCheckitemCheckedActivity extends IBaseProjectCardActivity<IProjectCardCheckitemActivityHistory> {
    activity_type: EProjectActivityType.CardCheckitemChecked;
}
export interface IProjectCardCheckitemUncheckedActivity extends IBaseProjectCardActivity<IProjectCardCheckitemActivityHistory> {
    activity_type: EProjectActivityType.CardCheckitemUnchecked;
}
export interface IProjectCardCheckitemCardifiedActivity extends IBaseProjectCardActivity<
    IProjectCardCheckitemActivityHistory & { cardified_card: { uid: string } }
> {
    activity_type: EProjectActivityType.CardCheckitemCardified;
}
export interface IProjectCardCheckitemDeletedActivity extends IBaseProjectCardActivity<IProjectCardCheckitemActivityHistory> {
    activity_type: EProjectActivityType.CardCheckitemDeleted;
}

export type TProjectCardCheckitemActivityInterface =
    | IProjectCardCheckitemCreatedActivity
    | IProjectCardCheckitemTitleChangedActivity
    | IProjectCardCheckitemTimerStartedActivity
    | IProjectCardCheckitemTimerPausedActivity
    | IProjectCardCheckitemTimerStoppedActivity
    | IProjectCardCheckitemCheckedActivity
    | IProjectCardCheckitemUncheckedActivity
    | IProjectCardCheckitemCardifiedActivity
    | IProjectCardCheckitemDeletedActivity;
