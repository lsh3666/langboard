from typing import Any
from ....core.domain import BaseDomainService
from ....core.types.ParamTypes import TUserGroupParam
from ....domain.models import User, UserEmail, UserGroup, UserGroupAssignedEmail
from ....helpers import InfraHelper


class UserGroupService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user_group"

    async def get_api_list_by_user(self, user: User) -> list[dict[str, Any]]:
        if not user.id:
            return []

        raw_groups = self.repo.user_group.get_all_by_user(user)
        groups = []
        for group in raw_groups:
            records = await self.get_api_user_email_list_by_group(group)
            api_group = group.api_response()
            api_group["users"] = records
            groups.append(api_group)
        return groups

    async def get_api_user_email_list_by_group(self, user_group: TUserGroupParam | None) -> list[dict[str, Any]]:
        user_group = InfraHelper.get_by_id_like(UserGroup, user_group)
        if not user_group:
            return []

        records = self.repo.user_group_assigned_email.get_users_by_group(user_group)

        users = []
        for assigned_email, existing_user in records:
            if existing_user:
                users.append(existing_user.api_response())
            else:
                users.append(User.create_email_user_api_response(assigned_email.id, assigned_email.email))
        return users

    async def create(self, user: User, name: str, emails: list[str] | None = None) -> UserGroup:
        emails = emails or []
        user_group = UserGroup(user_id=user.id, name=name, order=self.repo.user_group.get_next_order(user))

        self.repo.user_group.insert(user_group)

        for email in set(emails):
            assigned_email = UserGroupAssignedEmail(group_id=user_group.id, email=email)
            self.repo.user_group_assigned_email.insert(assigned_email)

        return user_group

    async def change_name(self, user: User, user_group: TUserGroupParam | None, name: str) -> bool:
        user_group = InfraHelper.get_by_id_like(UserGroup, user_group)
        if not user_group or user_group.user_id != user.id:
            return False

        user_group.name = name

        self.repo.user_group.update(user_group)

        return True

    async def update_assigned_emails(self, user: User, user_group: TUserGroupParam | None, emails: list[str]) -> bool:
        user_group = InfraHelper.get_by_id_like(UserGroup, user_group)
        if not user_group or user_group.user_id != user.id:
            return False

        self.repo.user_group_assigned_email.delete_all_by_group(user_group)

        app_users = InfraHelper.get_all_by(User, "email", emails)
        app_user_subemails = InfraHelper.get_all_by(UserEmail, "email", emails)
        unique_app_user_emails_map = {}
        appended_emails = []
        for app_user in app_users:
            appended_emails.append(app_user.email)
            unique_app_user_emails_map[app_user.id] = app_user.email
        for app_user_subemail in app_user_subemails:
            appended_emails.append(app_user_subemail.email)
            if app_user_subemail.user_id in unique_app_user_emails_map:
                continue
            unique_app_user_emails_map[app_user_subemail.user_id] = app_user_subemail.email

        unique_app_user_emails = set(unique_app_user_emails_map.values())
        none_user_emails = [email for email in emails if email not in appended_emails]
        all_emails = unique_app_user_emails.union(none_user_emails)

        for email in all_emails:
            assigned_email = UserGroupAssignedEmail(group_id=user_group.id, email=email)
            self.repo.user_group_assigned_email.insert(assigned_email)

        return True

    async def delete(self, user: User, user_group: TUserGroupParam | None) -> bool:
        user_group = InfraHelper.get_by_id_like(UserGroup, user_group)
        if not user_group or user_group.user_id != user.id:
            return False

        self.repo.user_group_assigned_email.delete_all_by_group(user_group)

        self.repo.user_group.delete(user_group)

        return True
