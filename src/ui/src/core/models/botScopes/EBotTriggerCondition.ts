export enum EBotTriggerCondition {
    // Project
    ProjectUpdated = "project_updated",
    ProjectDeleted = "project_deleted",

    // Project Label
    ProjectLabelCreated = "project_label_created",
    ProjectLabelUpdated = "project_label_updated",
    ProjectLabelDeleted = "project_label_deleted",

    // Project Wiki
    ProjectWikiCreated = "project_wiki_created",
    ProjectWikiUpdated = "project_wiki_updated",
    ProjectWikiPublicityChanged = "project_wiki_publicity_changed",
    ProjectWikiDeleted = "project_wiki_deleted",

    // Project Column
    ProjectColumnNameChanged = "project_column_name_changed",
    ProjectColumnDeleted = "project_column_deleted",

    // Card
    CardCreated = "card_created",
    CardUpdated = "card_updated",
    CardMoved = "card_moved",
    CardLabelsUpdated = "card_labels_updated",
    CardRelationshipsUpdated = "card_relationships_updated",
    CardDeleted = "card_deleted",

    // Card Attachment
    CardAttachmentUploaded = "card_attachment_uploaded",
    CardAttachmentNameChanged = "card_attachment_name_changed",
    CardAttachmentDeleted = "card_attachment_deleted",

    // Card Comment
    CardCommentAdded = "card_comment_added",
    CardCommentUpdated = "card_comment_updated",
    CardCommentDeleted = "card_comment_deleted",
    CardCommentReacted = "card_comment_reacted",
    CardCommentUnreacted = "card_comment_unreacted",

    // Card Checklist
    CardChecklistCreated = "card_checklist_created",
    CardChecklistTitleChanged = "card_checklist_title_changed",
    CardChecklistChecked = "card_checklist_checked",
    CardChecklistUnchecked = "card_checklist_unchecked",
    CardChecklistDeleted = "card_checklist_deleted",

    // Card Checkitem
    CardCheckitemCreated = "card_checkitem_created",
    CardCheckitemTitleChanged = "card_checkitem_title_changed",
    CardCheckitemTimerStarted = "card_checkitem_timer_started",
    CardCheckitemTimerPaused = "card_checkitem_timer_paused",
    CardCheckitemTimerStopped = "card_checkitem_timer_stopped",
    CardCheckitemChecked = "card_checkitem_checked",
    CardCheckitemUnchecked = "card_checkitem_unchecked",
    CardCheckitemCardified = "card_checkitem_cardified",
    CardCheckitemDeleted = "card_checkitem_deleted",
}

export const PROJECT_CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    project: [EBotTriggerCondition.ProjectUpdated, EBotTriggerCondition.ProjectDeleted],
    project_label: [EBotTriggerCondition.ProjectLabelCreated, EBotTriggerCondition.ProjectLabelUpdated, EBotTriggerCondition.ProjectLabelDeleted],
};

export const WIKI_CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    project_wiki: [
        EBotTriggerCondition.ProjectWikiCreated,
        EBotTriggerCondition.ProjectWikiUpdated,
        EBotTriggerCondition.ProjectWikiPublicityChanged,
        EBotTriggerCondition.ProjectWikiDeleted,
    ],
};

export const COLUMN_CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    project_column: [EBotTriggerCondition.ProjectColumnNameChanged, EBotTriggerCondition.ProjectColumnDeleted],
};

export const CARD_CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    card: [
        EBotTriggerCondition.CardUpdated,
        EBotTriggerCondition.CardMoved,
        EBotTriggerCondition.CardLabelsUpdated,
        EBotTriggerCondition.CardRelationshipsUpdated,
        EBotTriggerCondition.CardDeleted,
    ],
    card_attachment: [
        EBotTriggerCondition.CardAttachmentUploaded,
        EBotTriggerCondition.CardAttachmentNameChanged,
        EBotTriggerCondition.CardAttachmentDeleted,
    ],
    card_comment: [
        EBotTriggerCondition.CardCommentAdded,
        EBotTriggerCondition.CardCommentUpdated,
        EBotTriggerCondition.CardCommentDeleted,
        EBotTriggerCondition.CardCommentReacted,
        EBotTriggerCondition.CardCommentUnreacted,
    ],
    card_checklist: [
        EBotTriggerCondition.CardChecklistCreated,
        EBotTriggerCondition.CardChecklistTitleChanged,
        EBotTriggerCondition.CardChecklistChecked,
        EBotTriggerCondition.CardChecklistUnchecked,
        EBotTriggerCondition.CardChecklistDeleted,
    ],
    card_checkitem: [
        EBotTriggerCondition.CardCheckitemCreated,
        EBotTriggerCondition.CardCheckitemTitleChanged,
        EBotTriggerCondition.CardCheckitemTimerStarted,
        EBotTriggerCondition.CardCheckitemTimerPaused,
        EBotTriggerCondition.CardCheckitemTimerStopped,
        EBotTriggerCondition.CardCheckitemChecked,
        EBotTriggerCondition.CardCheckitemUnchecked,
        EBotTriggerCondition.CardCheckitemCardified,
        EBotTriggerCondition.CardCheckitemDeleted,
    ],
};
