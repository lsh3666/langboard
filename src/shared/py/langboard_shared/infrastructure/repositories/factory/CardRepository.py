from sqlalchemy import func
from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseOrderRepository
from ....core.schema import TimeBasedPagination
from ....core.types import SafeDateTime
from ....core.types.ParamTypes import TColumnParam, TProjectParam, TUserParam
from ....domain.models import Card, CardAssignedUser, CardComment, Checkitem, Project, ProjectColumn, ProjectRole
from ....helpers import InfraHelper


class CardRepository(BaseOrderRepository[Card, ProjectColumn]):
    @staticmethod
    def parent_model_cls():
        return ProjectColumn

    @staticmethod
    def model_cls():
        return Card

    @staticmethod
    def name() -> str:
        return "card"

    def get_board_list(self, project: TProjectParam):
        project_id = InfraHelper.convert_id(project)

        cards = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(
                    Card,
                    func.count(CardComment.column("id")).label("count_comment"),  # type: ignore
                )
                .join(Project, Card.column("project_id") == Project.column("id"))
                .outerjoin(
                    CardComment,
                    (Card.column("id") == CardComment.column("card_id")) & (CardComment.column("deleted_at") == None),  # noqa
                )
                .where(Project.column("id") == project_id)
                .order_by(Card.column("order").asc())
                .group_by(Card.column("id"), Card.column("order"))
            )
            cards = result.all()

        return cards

    def get_dashboard_list_scroller(self, user: TUserParam, pagination: TimeBasedPagination):
        user_id = InfraHelper.convert_id(user)
        query = (
            SqlBuilder.select.tables(Card, Project, ProjectColumn)
            .join(Project, Card.column("project_id") == Project.column("id"))
            .join(
                ProjectColumn,
                (Card.column("project_column_id") == ProjectColumn.column("id"))
                & (ProjectColumn.column("project_id") == Project.column("id")),
            )
            .join(ProjectRole, Project.column("id") == ProjectRole.column("project_id"))
            .outerjoin(
                CardAssignedUser,
                Card.column("id") == CardAssignedUser.column("card_id"),
            )
            .where(
                (ProjectRole.column("user_id") == user_id)
                & (
                    (
                        (ProjectRole.column("actions") == "*")
                        & (
                            (CardAssignedUser.column("card_id") == None)  # noqa
                            | (CardAssignedUser.column("user_id") == user_id)
                        )
                    )
                    | ((ProjectRole.column("actions") != "*") & (CardAssignedUser.column("user_id") == user_id))
                )
            )
            .where(Checkitem.column("created_at") <= pagination.refer_time)
            .order_by(Card.column("created_at").desc())
            .group_by(
                Card.column("id"),
                Card.column("created_at"),
                ProjectColumn.column("id"),
                Project.column("id"),
            )
        )
        query = InfraHelper.paginate(query, pagination.page, pagination.limit)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            records = result.all()
        return records

    def get_all_by_project(self, project: TProjectParam):
        project_id = InfraHelper.convert_id(project)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(Card, ProjectColumn)
                .join(
                    ProjectColumn,
                    Card.column("project_column_id") == ProjectColumn.column("id"),
                )
                .where(Card.column("project_id") == project_id)
                .order_by(Card.column("order").asc())
            )
            records = result.all()
        return records

    def get_all_by_column(self, column: TColumnParam):
        column_id = InfraHelper.convert_id(column)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(Card)
                .where(Card.column("project_column_id") == column_id)
                .order_by(Card.column("order").asc())
            )
            records = result.all()
        return records

    def move_all_by_column(
        self,
        source_column: TColumnParam,
        dest_column: TColumnParam,
        count_cards_in_dest_column: int,
        is_archive: bool = False,
    ):
        source_column_id = InfraHelper.convert_id(source_column)
        dest_column_id = InfraHelper.convert_id(dest_column)
        current_time = SafeDateTime.now()

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(Card)
                .values({Card.order: Card.order + count_cards_in_dest_column})
                .where(Card.column("project_column_id") == dest_column_id)
            )

            ordered_cards_cte = (
                SqlBuilder.select.columns(
                    Card.column("id"),
                    (func.row_number().over(order_by=Card.column("order")) - 1).label("new_order"),
                )
                .where(Card.column("project_column_id") == source_column_id)
                .cte("ordered_cards")
            )

            db.exec(
                SqlBuilder.update.table(Card)
                .filter(Card.column("id") == ordered_cards_cte.c.id)
                .values(
                    {
                        Card.column("order"): ordered_cards_cte.c.new_order,
                        Card.column("project_column_id"): dest_column_id,
                        Card.column("archived_at"): current_time if is_archive else None,
                    }
                )
            )
