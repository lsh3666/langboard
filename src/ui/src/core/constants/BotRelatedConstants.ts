import {
    Project,
    ProjectBotSchedule,
    ProjectBotScope,
    ProjectCard,
    ProjectCardBotSchedule,
    ProjectCardBotScope,
    ProjectColumn,
    ProjectColumnBotSchedule,
    ProjectColumnBotScope,
} from "@/core/models";

export const BOT_SCHEDULES = {
    project: ProjectBotSchedule,
    project_column: ProjectColumnBotSchedule,
    card: ProjectCardBotSchedule,
};

export const BOT_SCOPES = {
    project: ProjectBotScope,
    project_column: ProjectColumnBotScope,
    card: ProjectCardBotScope,
};

export const BOT_TARGET_MODELS = {
    project: Project,
    project_column: ProjectColumn,
    card: ProjectCard,
};

export const BOT_TARGET_MODEL_FOREIGN_KEY = {
    project: "project_uid",
    project_column: "project_column_uid",
    card: "card_uid",
} as const;
