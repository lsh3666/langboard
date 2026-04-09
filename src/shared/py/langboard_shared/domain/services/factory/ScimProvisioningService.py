from re import IGNORECASE, search
from typing import Any
from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseDomainService
from ....core.routing import ApiErrorCode, ApiException
from ....core.types import SafeDateTime
from ....core.utils.String import generate_random_string
from ....Env import Env
from ....security import Auth
from ...models import IdentityProvider, User
from .IdentityLinkService import IdentityLinkService
from .UserService import UserService


class ScimProvisioningService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "scim_provisioning"

    @property
    def SCIM_USER_SCHEMA(self) -> str:
        return "urn:ietf:params:scim:schemas:core:2.0:User"

    @property
    def SCIM_LIST_SCHEMA(self) -> str:
        return "urn:ietf:params:scim:api:messages:2.0:ListResponse"

    def resolve_user(self, identifier: str) -> User | None:
        identity_link = self._get_service(IdentityLinkService)
        user = identity_link.get_user_by_provider_external_id(IdentityProvider.Scim, identifier)
        if user:
            return user

        user_service = self._get_service(UserService)
        return user_service.get_by_id_like(identifier)

    def build_scim_user(self, user: User) -> dict[str, Any]:
        identity_link = self._get_service(IdentityLinkService)
        link = identity_link.get_by_user_provider(user, IdentityProvider.Scim)
        external_id = link.external_id if link else user.get_uid()

        return {
            "schemas": [self.SCIM_USER_SCHEMA],
            "id": user.get_uid(),
            "externalId": external_id,
            "userName": user.email,
            "name": {
                "givenName": user.firstname,
                "familyName": user.lastname,
            },
            "displayName": user.get_fullname(),
            "active": bool(user.activated_at),
            "emails": [{"value": user.email, "primary": True}],
            "meta": {
                "resourceType": "User",
                "created": user.created_at,
                "lastModified": user.updated_at,
            },
        }

    def list_users(self, start_index: int, count: int, filter_value: str | None) -> dict[str, Any]:
        normalized_start = self._coerce_int(start_index, default=1, min_value=1, max_value=100000)
        normalized_count = self._coerce_int(count, default=100, min_value=1, max_value=200)
        user_name_filter = self._parse_scim_filter(filter_value)
        user_service = self._get_service(UserService)

        if user_name_filter:
            user, _ = user_service.get_by_email(user_name_filter)
            resources = [self.build_scim_user(user)] if user else []
            return self._build_list_response(resources, 1, len(resources), len(resources))

        with DbSession.use(readonly=True) as db:
            total = (
                db.exec(
                    SqlBuilder.select.count(User, User.column("id")).where(User.column("deleted_at") == None)  # noqa
                ).first()
                or 0
            )

            users = db.exec(
                SqlBuilder.select.table(User)
                .where(User.column("deleted_at") == None)  # noqa
                .order_by(User.column("created_at").asc(), User.column("id").asc())
                .offset(normalized_start - 1)
                .limit(normalized_count)
            ).all()

        resources = [self.build_scim_user(user) for user in users]
        return self._build_list_response(resources, normalized_start, normalized_count, int(total))

    def create_or_upsert_user(self, payload: dict[str, Any]) -> User:
        email = self._extract_email(payload)
        user_service = self._get_service(UserService)
        user, _ = user_service.get_by_email(email) if email else (None, None)

        if user:
            self.apply_user_mutations(user, payload)
            return user

        return self.create_user(payload)

    def create_user(self, payload: dict[str, Any]) -> User:
        email = self._extract_email(payload)
        if not email:
            raise ApiException.BadRequest_400(ApiErrorCode.VA0000)

        firstname, lastname = self._extract_names(payload)
        firstname = firstname or "SCIM"
        lastname = lastname or "User"

        now = SafeDateTime.now()
        active = payload.get("active")
        should_activate = bool(active) if isinstance(active, bool) else True

        form = {
            "firstname": firstname,
            "lastname": lastname,
            "email": email,
            "password": generate_random_string(48),
            "industry": "SCIM",
            "purpose": "Provisioning",
            "affiliation": None,
            "position": None,
        }
        if should_activate:
            form["created_at"] = now
            form["updated_at"] = now
            form["activated_at"] = now

        user_service = self._get_service(UserService)
        user, _ = user_service.create(form)
        self._upsert_identity_link(user, payload.get("externalId"), email)
        return user

    def apply_user_mutations(self, user: User, payload: dict[str, Any]) -> None:
        firstname, lastname = self._extract_names(payload)
        email = self._extract_email(payload)
        active = payload.get("active")

        update_form: dict[str, Any] = {}
        if firstname is not None and firstname != "" and firstname != user.firstname:
            update_form["firstname"] = firstname
        if lastname is not None and lastname != "" and lastname != user.lastname:
            update_form["lastname"] = lastname
        if update_form:
            self._get_service(UserService).update(user, update_form)

        if isinstance(active, bool):
            user_service = self._get_service(UserService)
            if active and not user.activated_at:
                user_service.activate(user)
            elif not active and user.activated_at:
                user_service.update(user, {"activated_at": None}, from_setting=True)

        if email and email != user.email:
            existing, _ = self._get_service(UserService).get_by_email(email)
            if existing and existing.id != user.id:
                raise ApiException.Conflict_409(ApiErrorCode.EX1003)

            user.email = email
            self.repo.user.update(user)
            Auth.reset_user(user)

        self._upsert_identity_link(user, payload.get("externalId"), user.email)

    def deactivate_user(self, user: User) -> None:
        if user.activated_at:
            self._get_service(UserService).update(user, {"activated_at": None}, from_setting=True)

    def normalize_patch_payload(self, operations: list[dict[str, Any]]) -> dict[str, Any]:
        payload: dict[str, Any] = {}
        for operation in operations:
            op = str(operation.get("op", "")).strip().lower()
            path = str(operation.get("path", "")).strip()
            path_lower = path.lower()
            value = operation.get("value")

            if op not in {"add", "replace", "remove"}:
                continue

            if not path and isinstance(value, dict):
                payload.update(value)
                continue

            if path_lower == "active":
                payload["active"] = False if op == "remove" else bool(value)
                continue

            if path_lower in {"username", "emails.value"}:
                if op != "remove" and value is not None:
                    payload["userName"] = str(value)
                continue

            if path_lower == "name.givenname":
                payload.setdefault("name", {})
                if op != "remove" and value is not None:
                    payload["name"]["givenName"] = str(value)
                continue

            if path_lower == "name.familyname":
                payload.setdefault("name", {})
                if op != "remove" and value is not None:
                    payload["name"]["familyName"] = str(value)
                continue

            if path_lower == "externalid":
                if op != "remove" and value is not None:
                    payload["externalId"] = str(value)
                continue

        return payload

    def _upsert_identity_link(self, user: User, external_id: Any, email: str | None) -> None:
        external_id_str = str(external_id).strip() if external_id else ""
        if not external_id_str:
            return

        self._get_service(IdentityLinkService).upsert_user_link(
            user=user,
            provider=IdentityProvider.Scim,
            external_id=external_id_str,
            issuer=Env.SCIM_ISSUER or None,
            email=email,
        )

    def _extract_email(self, payload: dict[str, Any]) -> str:
        emails = payload.get("emails")
        if isinstance(emails, list):
            for item in emails:
                if not isinstance(item, dict):
                    continue
                value = item.get("value")
                if value:
                    return str(value).strip().lower()

        user_name = payload.get("userName", "")
        return str(user_name).strip().lower()

    def _extract_names(self, payload: dict[str, Any]) -> tuple[str | None, str | None]:
        name = payload.get("name", {})
        if not isinstance(name, dict):
            name = {}

        firstname = name.get("givenName")
        lastname = name.get("familyName")

        firstname = str(firstname).strip() if firstname is not None else None
        lastname = str(lastname).strip() if lastname is not None else None
        return firstname, lastname

    def _parse_scim_filter(self, filter_value: str | None) -> str | None:
        if not filter_value:
            return None
        match = search(r"userName\s+eq\s+[\"']([^\"']+)[\"']", filter_value, IGNORECASE)
        if not match:
            return None
        return match.group(1).strip().lower()

    def _build_list_response(
        self, resources: list[dict[str, Any]], start_index: int, items_per_page: int, total: int
    ) -> dict[str, Any]:
        return {
            "schemas": [self.SCIM_LIST_SCHEMA],
            "totalResults": total,
            "startIndex": start_index,
            "itemsPerPage": items_per_page,
            "Resources": resources,
        }

    def _coerce_int(self, value: int, default: int, min_value: int, max_value: int) -> int:
        return max(min_value, min(max_value, value if isinstance(value, int) else default))
