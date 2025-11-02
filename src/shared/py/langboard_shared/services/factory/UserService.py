from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, Literal, cast, overload
from urllib.parse import urlparse
from ...core.caching import Cache
from ...core.db import DbSession, SqlBuilder
from ...core.resources.locales.LangEnum import LangEnum
from ...core.service import BaseService
from ...core.storage import FileModel
from ...core.types import SafeDateTime, SnowflakeID
from ...core.utils.Converter import convert_python_data
from ...core.utils.Encryptor import Encryptor
from ...core.utils.String import concat, generate_random_string
from ...Env import UI_QUERY_NAMES, Env
from ...helpers import ServiceHelper
from ...models import User, UserEmail, UserProfile
from ...publishers import AppSettingPublisher, UserPublisher
from ...security import Auth
from ...tasks.activities import UserActivityTask


class UserService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user"

    def create_cache_name(self, cache_type: str, email: str) -> str:
        return f"{cache_type}:{email}"

    def get_by_id(self, user_id: SnowflakeID) -> User | None:
        return ServiceHelper.get_by_param(User, user_id)

    @overload
    async def get_list(self, refer_time: SafeDateTime) -> tuple[list[tuple[User, UserProfile]], int]: ...
    @overload
    async def get_list(self, refer_time: SafeDateTime, only_count: Literal[True]) -> int: ...
    @overload
    async def get_list(
        self, refer_time: SafeDateTime, only_count: Literal[False]
    ) -> tuple[list[tuple[User, UserProfile]], int]: ...
    async def get_list(self, refer_time: SafeDateTime, only_count: bool = False):
        outdated_query = SqlBuilder.select.count(User, User.column("id")).where(
            (User.column("created_at") > refer_time) & (User.column("deleted_at") == None)  # noqa
        )

        count = 0
        with DbSession.use(readonly=True) as db:
            count = db.exec(outdated_query).first() or 0
        if only_count:
            return count

        query = (
            SqlBuilder.select.tables(User, UserProfile)
            .join(UserProfile, User.column("id") == UserProfile.column("user_id"))
            .where(User.column("created_at") <= refer_time)
            .order_by(User.column("created_at").desc(), User.column("id").desc())
        )

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            records = result.all()

        return records, count

    async def get_by_uid(self, uid: str) -> User | None:
        return ServiceHelper.get_by_param(User, uid)

    async def get_by_email(self, email: str | None) -> tuple[User, UserEmail | None] | tuple[None, None]:
        user = ServiceHelper.get_by(User, "email", email)
        if user:
            return user, None
        record = (None, None)
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(User, UserEmail)
                .join(
                    UserEmail,
                    (User.column("id") == UserEmail.column("user_id")) & (UserEmail.column("deleted_at") == None),  # noqa
                )
                .where(UserEmail.column("email") == email)
                .limit(1)
            )
            record = result.first() or (None, None)
        return record

    async def get_by_token(
        self, token: str | None, key: str | None
    ) -> tuple[User, UserEmail | None] | tuple[None, None]:
        if not token or not key:
            return None, None
        email = Encryptor.decrypt(token, key)
        return await self.get_by_email(email)

    async def get_profile(self, user: User) -> UserProfile:
        return cast(UserProfile, ServiceHelper.get_by(UserProfile, "user_id", user.id))

    async def create(self, form: dict, avatar: FileModel | None = None) -> tuple[User, UserProfile]:
        user = User(**form)
        user.avatar = avatar

        with DbSession.use(readonly=False) as db:
            db.insert(user)

        with DbSession.use(readonly=False) as db:
            user_profile = UserProfile(user_id=user.id, **form)
            db.insert(user_profile)

        return user, user_profile

    async def create_subemail(self, user_id: SnowflakeID, email: str) -> UserEmail:
        user_email = UserEmail(user_id=user_id, email=email)
        with DbSession.use(readonly=False) as db:
            db.insert(user_email)

        return user_email

    async def get_subemails(self, user: User) -> list[dict[str, Any]]:
        if not user.id:
            return []
        raw_subemails = ServiceHelper.get_all_by(UserEmail, "user_id", user.id)
        subemails = [subemail.api_response() for subemail in raw_subemails]
        return subemails

    async def create_token_url(
        self,
        user: User,
        cache_key: str,
        token_query_name: UI_QUERY_NAMES,
        extra_token_data: dict | None = None,
    ) -> str:
        token = generate_random_string(32)
        token_expire_hours = 24
        token_data = json_dumps({"token": token, "id": user.id})
        encrypted_token = Encryptor.encrypt(token_data, Env.COMMON_SECRET_KEY)

        url_chunks = urlparse(Env.UI_REDIRECT_URL)
        token_url = url_chunks._replace(
            query=concat(
                url_chunks.query,
                "&" if url_chunks.query else "",
                token_query_name.value,
                "=",
                encrypted_token,
            )
        ).geturl()

        cache_token_Data = {"token": token, "id": user.id}
        if extra_token_data:
            cache_token_Data["extra"] = extra_token_data

        await Cache.set(cache_key, cache_token_Data, 60 * 60 * token_expire_hours)

        return token_url

    async def validate_token_from_url(
        self, token_type: str, token: str
    ) -> tuple[User, str, dict | None] | tuple[None, None, None]:
        try:
            token_info = json_loads(Encryptor.decrypt(token, Env.COMMON_SECRET_KEY))
            if not token_info or "token" not in token_info or "id" not in token_info:
                raise Exception()
        except Exception:
            return None, None, None

        user = ServiceHelper.get_by(User, "id", token_info["id"])
        if not user:
            return None, None, None

        cache_key = self.create_cache_name(token_type, user.email)

        cached_token_info = await Cache.get(cache_key)
        if (
            not cached_token_info
            or cached_token_info["id"] != user.id
            or cached_token_info["token"] != token_info["token"]
        ):
            return None, None, None

        return user, cache_key, cached_token_info.get("extra")

    async def activate(self, user: User) -> None:
        user.activated_at = SafeDateTime.now()
        with DbSession.use(readonly=False) as db:
            db.update(user)

        invitation_service = self._get_service_by_name("project_invitation")
        await invitation_service.update_by_signed_up(user)

        UserActivityTask.activated(user)

    async def verify_subemail(self, subemail: UserEmail) -> None:
        subemail.verified_at = SafeDateTime.now()
        with DbSession.use(readonly=False) as db:
            db.update(subemail)

    async def update(self, user: User, form: dict, from_setting: bool = False) -> bool:
        profile = await self.get_profile(user)
        mutable_keys = ["firstname", "lastname", "avatar"]
        profile_mutable_keys = ["affiliation", "position"]
        if from_setting:
            mutable_keys.extend(["is_admin", "activated_at"])
            profile_mutable_keys.extend(["industry", "purpose"])

        old_user_record = {}

        for key in mutable_keys:
            if key not in form or not hasattr(user, key):
                continue
            old_value = getattr(user, key)
            new_value = form[key]
            if from_setting and key == "activated_at":
                if old_value == new_value:
                    continue
            elif old_value == new_value or new_value is None:
                continue
            old_user_record[key] = convert_python_data(old_value)
            setattr(user, key, new_value)

        for key in profile_mutable_keys:
            if key not in form or not hasattr(profile, key):
                continue
            old_value = getattr(profile, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_user_record[key] = convert_python_data(old_value)
            setattr(profile, key, new_value)

        if "delete_avatar" in form and form["delete_avatar"]:
            old_user_record["avatar"] = convert_python_data(user.avatar)
            user.avatar = None

        if not old_user_record:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(user)
            db.update(profile)

        await Auth.reset_user(user)

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_user_record:
                continue
            if key == "avatar":
                model[key] = user.avatar.path if user.avatar else None
            else:
                model[key] = convert_python_data(getattr(user, key))

        await UserPublisher.updated(user, model)
        if from_setting:
            if "activated_at" in form and not user.activated_at:
                await UserPublisher.deactivated(user)

        return True

    async def update_preferred_lang(self, user: User, lang: str):
        if lang in LangEnum.__members__:
            lang = LangEnum[lang].value
        elif lang in LangEnum._value2member_map_:
            lang = lang
        else:
            return False

        user.preferred_lang = lang
        with DbSession.use(readonly=False) as db:
            db.update(user)

        return True

    async def change_primary_email(self, user: User, subemail: UserEmail) -> bool:
        user_email = user.email
        user.email = subemail.email
        subemail.email = user_email

        with DbSession.use(readonly=False) as db:
            db.update(user)
            db.update(subemail)

        await Auth.reset_user(user)

        model = {"email": user.email}
        await UserPublisher.updated(user, model)

        return True

    async def delete_email(self, subemail: UserEmail) -> bool:
        with DbSession.use(readonly=False) as db:
            db.delete(subemail)

        return True

    async def change_password(self, user: User, password: str) -> None:
        user.set_password(password)
        with DbSession.use(readonly=False) as db:
            db.update(user)

    async def delete(self, user: User) -> None:
        with DbSession.use(readonly=False) as db:
            db.delete(user)

        await Auth.reset_user(user)
        await UserPublisher.deleted(user)

    async def delete_selected(self, uids: list[str]) -> None:
        user_ids = [SnowflakeID.from_short_code(uid) for uid in uids]

        with DbSession.use(readonly=False) as db:
            db.exec(SqlBuilder.delete.table(User).where(User.column("id").in_(user_ids)))

        await AppSettingPublisher.selected_users_deleted(uids)
        for user_id in user_ids:
            await UserPublisher.deleted(user_id)
