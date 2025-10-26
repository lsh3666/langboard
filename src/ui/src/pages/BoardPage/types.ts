import { AuthUser, Project } from "@/core/models";

export interface IBoardRelatedPageProps {
    project: Project.TModel;
    currentUser: AuthUser.TModel;
}
