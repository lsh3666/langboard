from typing import Any, Literal, overload
from core.db import DbSession, SqlBuilder
from core.service import BaseService
from core.utils.Converter import convert_python_data
from helpers import ServiceHelper
from models import Card, CardAssignedProjectLabel, Project, ProjectLabel
from publishers import ProjectLabelPublisher
from ...tasks.activities import ProjectLabelActivityTask
from ...tasks.bots import ProjectLabelBotTask
from .Types import TCardParam, TProjectLabelParam, TProjectParam, TUserOrBot


class ProjectLabelService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_label"

    @overload
    async def get_all(self, project: TProjectParam, as_api: Literal[False]) -> list[ProjectLabel]: ...
    @overload
    async def get_all(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all(self, project: TProjectParam, as_api: bool) -> list[ProjectLabel] | list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []
        raw_labels = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectLabel)
                .where(ProjectLabel.column("project_id") == project.id)
                .order_by(ProjectLabel.column("order").asc())
                .group_by(ProjectLabel.column("id"), ProjectLabel.column("order"))
            )
            raw_labels = result.all()
        if not as_api:
            return raw_labels
        return [label.api_response() for label in raw_labels]

    async def get_all_bot(self, project: TProjectParam) -> list[ProjectLabel]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []
        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectLabel)
                .where(ProjectLabel.column("project_id") == project.id)
                .order_by(ProjectLabel.column("order").asc())
                .group_by(ProjectLabel.column("id"), ProjectLabel.column("order"))
            )
            records = result.all()
        return records

    @overload
    async def get_all_by_card(self, card: TCardParam, as_api: Literal[False]) -> list[ProjectLabel]: ...
    @overload
    async def get_all_by_card(self, card: TCardParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_card(self, card: TCardParam, as_api: bool) -> list[ProjectLabel] | list[dict[str, Any]]:
        card = ServiceHelper.get_by_param(Card, card)
        if not card:
            return []

        raw_labels = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectLabel)
                .join(
                    CardAssignedProjectLabel,
                    ProjectLabel.column("id") == CardAssignedProjectLabel.column("project_label_id"),
                )
                .where(CardAssignedProjectLabel.column("card_id") == card.id)
            )
            raw_labels = result.all()
        if not as_api:
            return raw_labels
        return [label.api_response() for label in raw_labels]

    async def get_all_card_labels_by_project(
        self, project: TProjectParam
    ) -> list[tuple[ProjectLabel, CardAssignedProjectLabel]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []

        raw_labels = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(ProjectLabel, CardAssignedProjectLabel)
                .join(
                    CardAssignedProjectLabel,
                    ProjectLabel.column("id") == CardAssignedProjectLabel.column("project_label_id"),
                )
                .where(ProjectLabel.column("project_id") == project.id)
            )
            raw_labels = result.all()
        return raw_labels

    async def init_defaults(self, project: TProjectParam) -> list[ProjectLabel]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []

        labels: list[ProjectLabel] = []
        for default_label in ProjectLabel.DEFAULT_LABELS:
            label = ProjectLabel(
                project_id=project.id,
                name=default_label["name"],
                color=default_label["color"],
                description=default_label["description"],
                order=len(labels),
            )
            labels.append(label)
            with DbSession.use(readonly=False) as db:
                db.insert(label)

        return labels

    async def create(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        name: str,
        color: str,
        description: str,
    ) -> tuple[ProjectLabel, dict[str, Any]] | None:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return None

        max_order = ServiceHelper.get_max_order(ProjectLabel, "project_id", project.id)

        label = ProjectLabel(
            project_id=project.id,
            name=name,
            color=color,
            description=description,
            order=max_order,
        )
        with DbSession.use(readonly=False) as db:
            db.insert(label)

        await ProjectLabelPublisher.created(project, label)
        ProjectLabelActivityTask.project_label_created(user_or_bot, project, label)
        ProjectLabelBotTask.project_label_created(user_or_bot, project, label)

        return label, label.api_response()

    async def update(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        label: TProjectLabelParam,
        form: dict,
    ) -> dict[str, Any] | Literal[True] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectLabel, label))
        if not params:
            return None
        project, label = params

        old_label_record = {}
        mutable_keys = ["name", "color", "description"]

        for key in mutable_keys:
            if key not in form or not hasattr(label, key):
                continue
            old_value = getattr(label, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_label_record[key] = convert_python_data(old_value)
            setattr(label, key, new_value)

        if not old_label_record:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(label)

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_label_record:
                continue
            model[key] = convert_python_data(getattr(label, key))

        await ProjectLabelPublisher.updated(project, label, model)
        ProjectLabelActivityTask.project_label_updated(user_or_bot, project, old_label_record, label)
        ProjectLabelBotTask.project_label_updated(user_or_bot, project, label)

        return model

    async def change_order(self, project: TProjectParam, label: TProjectLabelParam, order: int) -> Literal[True] | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectLabel, label))
        if not params:
            return None
        project, label = params

        original_order = label.order
        update_query = SqlBuilder.update.table(ProjectLabel).where(ProjectLabel.column("project_id") == project.id)
        update_query = ServiceHelper.set_order_in_column(update_query, ProjectLabel, original_order, order)
        with DbSession.use(readonly=False) as db:
            # Lock
            db.exec(
                SqlBuilder.select.table(ProjectLabel)
                .where(ProjectLabel.column("project_id") == project.id)
                .with_for_update()
            ).all()

            db.exec(update_query)
            label.order = order
            db.update(label)

        await ProjectLabelPublisher.order_changed(project, label)

        return True

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, label: TProjectLabelParam) -> bool | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectLabel, label))
        if not params:
            return None
        project, label = params

        with DbSession.use(readonly=False) as db:
            db.delete(label)

        await ProjectLabelPublisher.deleted(project, label)
        ProjectLabelActivityTask.project_label_deleted(user_or_bot, project, label)
        ProjectLabelBotTask.project_label_deleted(user_or_bot, project, label)

        return True
