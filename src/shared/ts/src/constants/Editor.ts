export enum EEditorType {
    CardDescription = "card-description",
    CardComment = "card-comment",
    CardNewComment = "card-new-comment",
    WikiContent = "wiki-content",
}

export type TEditorType = `${EEditorType}`;

export enum EEditorCollaborationType {
    Card = "card",
    Wiki = "wiki",
    CardDescription = EEditorType.CardDescription,
    CardComment = EEditorType.CardComment,
    CardNewComment = EEditorType.CardNewComment,
    WikiContent = EEditorType.WikiContent,
}

export type TEditorCollaborationType = `${EEditorCollaborationType}`;
