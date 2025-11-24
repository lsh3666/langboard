from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, Literal, Sequence, overload
from urllib.parse import urlparse
from ....core.caching import Cache
from ....core.domain import BaseDomainService
from ....core.domain.BaseDomainService import TMutableValidatorMap
from ....core.resources.locales.LangEnum import LangEnum
from ....core.storage import FileModel
from ....core.types import SafeDateTime
from ....core.types.ParamTypes import TUserParam
from ....core.utils.Converter import convert_python_data
from ....core.utils.Encryptor import Encryptor
from ....core.utils.String import concat, generate_random_string
from ....domain.models import User, UserEmail, UserProfile
from ....Env import UI_QUERY_NAMES, Env
from ....helpers import InfraHelper
from ....publishers import AppSettingPublisher, UserPublisher
from ....security import Auth


class UserService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "user"

    async def get_by_id_like(self, user: TUserParam | None) -> User | None:
        project = InfraHelper.get_by_id_like(User, user)
        return project

    def create_cache_name(self, cache_type: str, email: str) -> str:
        return f"{cache_type}:{email}"

    @overload
    async def get_api_list_in_settings(self, refer_time: SafeDateTime, only_count: Literal[True]) -> int: ...
    @overload
    async def get_api_list_in_settings(
        self, refer_time: SafeDateTime, only_count: Literal[False]
    ) -> tuple[list[dict[str, Any]], int]: ...
    async def get_api_list_in_settings(self, refer_time: SafeDateTime, only_count: bool = False):
        count = self.repo.user.count_users_scroller(refer_time)
        if only_count:
            return count

        users = self.repo.user.get_all_with_profile_scroller(refer_time)

        api_list = []
        for user, profile in users:
            api_user = user.api_response()
            api_user.update(profile.api_response())
            api_user["created_at"] = user.created_at
            api_user["activated_at"] = user.activated_at
            api_user["is_admin"] = user.is_admin
            api_list.append(api_user)

        return api_list, count

    async def get_by_email(self, email: str | None):
        if not email:
            return None, None
        return self.repo.user.get_by_email(email)

    async def get_by_token(
        self, token: str | None, key: str | None
    ) -> tuple[User, UserEmail | None] | tuple[None, None]:
        if not token or not key:
            return None, None
        email = Encryptor.decrypt(token, key)
        return self.repo.user.get_by_email(email)

    async def get_api_profile(self, user: TUserParam) -> dict[str, Any]:
        profile = self.repo.user_profile.get_by_user(user)
        if not profile:
            return {}
        return profile.api_response()

    async def create(self, form: dict, avatar: FileModel | None = None) -> tuple[User, UserProfile]:
        user = User(**form)
        user.avatar = avatar

        self.repo.user.insert(user)

        user_profile = UserProfile(user_id=user.id, **form)
        self.repo.user_profile.insert(user_profile)

        return user, user_profile

    async def create_subemail(self, user: TUserParam, email: str) -> UserEmail:
        user_id = InfraHelper.convert_id(user)
        user_email = UserEmail(user_id=user_id, email=email)
        self.repo.user_email.insert(user_email)

        return user_email

    async def get_subemails(self, user: User) -> list[dict[str, Any]]:
        if not user.id:
            return []
        raw_subemails = self.repo.user_email.get_all_by_user(user.id)
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

        user = InfraHelper.get_by(User, "id", token_info["id"])
        if not user:
            return None, None, None

        cache_key = self.create_cache_name(token_type, user.email)

        cached_token_info: dict | None = await Cache.get(cache_key)
        if (
            not cached_token_info
            or cached_token_info["id"] != user.id
            or cached_token_info["token"] != token_info["token"]
        ):
            return None, None, None

        return user, cache_key, cached_token_info.get("extra")

    async def activate(self, user: User) -> None:
        user.activated_at = SafeDateTime.now()
        self.repo.user.update(user)

    async def verify_subemail(self, subemail: UserEmail) -> None:
        subemail.verified_at = SafeDateTime.now()
        self.repo.user_email.update(subemail)

    async def update(self, user: User, form: dict, from_setting: bool = False) -> bool:
        profile = self.repo.user_profile.get_by_user(user)
        if not profile:
            return False

        validators: TMutableValidatorMap = {
            "firstname": "default",
            "lastname": "default",
            "avatar": "default",
        }
        profile_validators: TMutableValidatorMap = {
            "affiliation": "default",
            "position": "default",
        }
        if from_setting:
            validators.update(
                {
                    "is_admin": "default",
                    "activated_at": "default",
                }
            )
            profile_validators.update(
                {
                    "industry": "default",
                    "purpose": "default",
                }
            )

        old_record = self.apply_mutates(user, form, validators)
        old_record.update(self.apply_mutates(profile, form, profile_validators))

        if "delete_avatar" in form and form["delete_avatar"]:
            old_record["avatar"] = convert_python_data(user.avatar)
            user.avatar = None

        if not old_record:
            return True

        self.repo.user.update([user, profile])

        await Auth.reset_user(user)

        model: dict[str, Any] = {}
        for key in form:
            if key not in validators or key not in old_record:
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
        self.repo.user.update(user)

        return True

    async def change_primary_email(self, user: User, subemail: UserEmail) -> bool:
        user_email = user.email
        user.email = subemail.email
        subemail.email = user_email

        self.repo.user.update([user, subemail])

        await Auth.reset_user(user)

        model = {"email": user.email}
        await UserPublisher.updated(user, model)

        return True

    async def delete_email(self, subemail: UserEmail) -> bool:
        self.repo.user_email.delete(subemail)

        return True

    async def change_password(self, user: User, password: str) -> None:
        user.set_password(password)
        self.repo.user.update(user)

    async def delete(self, user: User) -> None:
        self.repo.user.delete(user)

        await Auth.reset_user(user)
        await UserPublisher.deleted(user)

    async def delete_selected(self, users: Sequence[TUserParam]) -> None:
        if not isinstance(users, Sequence) or isinstance(users, str):
            users = [users]

        self.repo.user.delete(users)

        ids = [InfraHelper.convert_id(user) for user in users]
        uids = [InfraHelper.convert_uid(user) for user in users]
        await AppSettingPublisher.selected_users_deleted(uids)
        for user_id in ids:
            await UserPublisher.deleted(user_id)
