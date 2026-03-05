import { IBaseProjectCardActivity, IProjectCardActivityHistory } from "@/core/models/activities/project.card.activity.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";
import { IChangesInActivityHistory } from "@/core/models/activities/base.type";

export interface IProjectCardAttachmentActivityHistory extends IProjectCardActivityHistory {
    attachment: {
        name: string;
        url: string;
    };
}

export interface IProjectCardAttachmentUploadedActivity extends IBaseProjectCardActivity<IProjectCardAttachmentActivityHistory> {
    activity_type: EProjectActivityType.CardAttachmentUploaded;
}
export interface IProjectCardAttachmentNameChangedActivity extends IBaseProjectCardActivity<
    IProjectCardAttachmentActivityHistory & IChangesInActivityHistory
> {
    activity_type: EProjectActivityType.CardAttachmentNameChanged;
}
export interface IProjectCardAttachmentDeletedActivity extends IBaseProjectCardActivity<IProjectCardAttachmentActivityHistory> {
    activity_type: EProjectActivityType.CardAttachmentDeleted;
}

export type TProjectCardAttachmentActivityInterface =
    | IProjectCardAttachmentUploadedActivity
    | IProjectCardAttachmentNameChangedActivity
    | IProjectCardAttachmentDeletedActivity;
