from typing import Any, Literal, cast, overload
from fastapi import Depends, Request, status
from jwt import ExpiredSignatureError, InvalidTokenError
from starlette.datastructures import Headers
from starlette.requests import cookie_parser
from ..core.caching import Cache
from ..core.db import DbSession, SqlBuilder
from ..core.security import AuthSecurity
from ..core.utils.decorators import staticclass
from ..core.utils.IpAddress import is_ipv4_in_range, is_valid_ipv4_address_or_range
from ..domain.models import Bot, User
from ..domain.models.BaseBotModel import BaseBotModel, BotPlatform
from ..domain.models.Bot import ALLOWED_ALL_IPS
from ..Env import Env


@staticclass
class Auth:
    @overload
    @staticmethod
    def scope(where: Literal["all"]) -> User | Bot: ...
    @overload
    @staticmethod
    def scope(where: Literal["user"]) -> User: ...
    @overload
    @staticmethod
    def scope(where: Literal["bot"]) -> Bot: ...
    @staticmethod
    def scope(where: Literal["all", "user", "bot"]) -> User | Bot:
        """Creates a scope for the user to be used in :class:`fastapi.FastAPI` endpoints."""
        if where in {"all", "user", "bot"}:

            def get_user_or_bot(req: Request) -> User | Bot | None:  # type: ignore
                return req.auth

        else:
            raise ValueError("Auth.scope must be called with either 'all', 'user', or 'bot'")

        return Depends(get_user_or_bot)

    @staticmethod
    async def get_user_by_token(token: str) -> User | InvalidTokenError | ExpiredSignatureError | None:
        """Gets the user from the given token.

        :param token: The token to get the user from.

        :return User: The user if the token is valid.
        :return InvalidTokenError: If the token is invalid.
        :return ExpiredSignatureError: If the signature has expired.
        :return None: If the user could not be found.
        """
        try:
            payload = AuthSecurity.decode_access_token(token)
        except ExpiredSignatureError as e:
            return e
        except Exception:
            return InvalidTokenError("Invalid token")

        try:
            user_id = int(payload["sub"])
            if user_id <= 0:
                raise Exception()
        except Exception:
            return InvalidTokenError("Invalid token")

        return await Auth.get_user_by_id(user_id)

    @staticmethod
    async def get_user_by_id(user_id: int) -> User | InvalidTokenError | None:
        """Gets the user from the given ID.

        If the user is cached, it will return the cached user.

        Otherwise, it will get the user from the database.

        :param user_id: The user ID to get the user from.

        :return User: The user if the user exists.
        :return None: If the user does not exist.
        """
        cache_key = f"auth-user-{user_id}"
        try:
            cached_user = await Cache.get(cache_key, User.model_validate)
            if cached_user:
                return cached_user
        except Exception:
            pass

        try:
            user = None
            with DbSession.use(readonly=True) as db:
                result = db.exec(SqlBuilder.select.table(User).where(User.column("id") == user_id).limit(1))
                user = result.first()
            if not user:
                return InvalidTokenError("Invalid token")

            await Cache.set(cache_key, user, 60 * 5)

            return user
        except Exception:
            return None

    @staticmethod
    async def get_bot_by_api_token(api_token: str) -> Bot | None:
        """Gets the bot from the given API token.

        If the bot is cached, it will return the cached bot.

        Otherwise, it will get the bot from the database.

        :param api_token: The API token to get the bot from.

        :return Bot: The bot if the bot exists.
        :return None: If the bot does not exist.
        """
        cache_key = f"auth-bot-{api_token}"
        try:
            cached_bot = await Cache.get(cache_key, Bot.model_validate)
            if cached_bot:
                return cached_bot
        except Exception:
            pass

        try:
            bot = None
            with DbSession.use(readonly=True) as db:
                result = db.exec(SqlBuilder.select.table(Bot).where(Bot.column("app_api_token") == api_token).limit(1))
                bot = result.first()
            if not bot:
                return None

            await Cache.set(cache_key, bot, 60 * 5)

            return bot
        except Exception:
            return None

    @staticmethod
    async def reset_user(user: User) -> None:
        """Resets the user cache.

        :param user: The user to reset.
        """
        if user.is_new():
            return

        cache_key = f"auth-user-{user.id}"
        await Cache.delete(cache_key)

        await Cache.set(cache_key, user, 60 * 5)

    @staticmethod
    async def validate(queries_headers: dict[Any, Any] | Headers) -> User | Literal[401, 422]:
        """Validates the given headers or queries and returns the user if the token is valid.

        :param headers: The headers to validate.

        :return User: The user if the token is valid.
        :return 401: If the token is invalid. :class:`fastapi.status.HTTP_401_UNAUTHORIZED`
        :return 422: If the signature has expired. :class:`fastapi.status.HTTP_422_UNPROCESSABLE_CONTENT`
        """
        authorization = queries_headers.get(
            AuthSecurity.AUTHORIZATION_HEADER, queries_headers.get(AuthSecurity.AUTHORIZATION_HEADER.lower(), None)
        )
        if not authorization:
            return status.HTTP_401_UNAUTHORIZED

        if isinstance(queries_headers, Headers):
            authorization_schemas = authorization.split(" ", maxsplit=1)
            if len(authorization_schemas) != 2:
                return status.HTTP_401_UNAUTHORIZED
            access_token_scheme, access_token = authorization_schemas
            if access_token_scheme.lower() != "bearer":
                return status.HTTP_401_UNAUTHORIZED

            cookie = cookie_parser(queries_headers.get("cookie", ""))
            refresh_token = cookie.get(Env.REFRESH_TOKEN_NAME)
            compared_result = AuthSecurity.compare_tokens(access_token, refresh_token)
            if compared_result == "expired_access":
                return status.HTTP_422_UNPROCESSABLE_CONTENT
            if not compared_result:
                return status.HTTP_401_UNAUTHORIZED
        else:
            if not authorization:
                return status.HTTP_401_UNAUTHORIZED

            if authorization.startswith("Bearer "):
                access_token = authorization.split("Bearer ", maxsplit=1)[1]
            elif authorization.startswith("bearer "):
                access_token = authorization.split("bearer ", maxsplit=1)[1]
            else:
                access_token = authorization

        if not access_token:
            return status.HTTP_401_UNAUTHORIZED

        user = await Auth.get_user_by_token(access_token)
        if isinstance(user, User):
            return user
        elif isinstance(user, ExpiredSignatureError):
            return status.HTTP_422_UNPROCESSABLE_CONTENT
        else:
            return status.HTTP_401_UNAUTHORIZED

    @staticmethod
    async def validate_bot(headers: Headers) -> Bot | Literal[401]:
        ip = headers.get(AuthSecurity.IP_HEADER, headers.get(AuthSecurity.IP_HEADER.lower(), None))
        api_token = headers.get(AuthSecurity.API_TOKEN_HEADER, headers.get(AuthSecurity.API_TOKEN_HEADER.lower(), None))
        if not api_token:
            return status.HTTP_401_UNAUTHORIZED

        if Env.ENVIRONMENT != "development":
            if not ip:
                return status.HTTP_401_UNAUTHORIZED

            if "," in ip:
                ip = ip.split(",", maxsplit=1)[0]

            if not is_valid_ipv4_address_or_range(ip):
                return status.HTTP_401_UNAUTHORIZED

        bot = await Auth.get_bot_by_api_token(api_token)
        if not bot:
            return status.HTTP_401_UNAUTHORIZED

        if Env.ENVIRONMENT == "development":
            return bot

        allowed_all_ips = BaseBotModel.ALLOWED_ALL_IPS_BY_PLATFORMS.get(BotPlatform(bot.platform), [])
        if bot.platform_running_type in allowed_all_ips:
            return bot

        ip = cast(str, ip)
        if isinstance(bot.ip_whitelist, str):
            bot.ip_whitelist = bot.ip_whitelist.split(",")

        if ALLOWED_ALL_IPS in bot.ip_whitelist:
            return bot

        for ip_range in bot.ip_whitelist:
            if ip_range.endswith(".0/24"):
                if is_ipv4_in_range(ip, ip_range):
                    return bot
            else:
                if ip == ip_range:
                    return bot

        return status.HTTP_401_UNAUTHORIZED

    @staticmethod
    async def validate_user_by_api_token(headers: Headers) -> User | Literal[401]:
        api_token = headers.get(AuthSecurity.API_TOKEN_HEADER, headers.get(AuthSecurity.API_TOKEN_HEADER.lower(), None))
        if not api_token:
            return status.HTTP_401_UNAUTHORIZED

        try:
            payload = AuthSecurity.decode_access_token(api_token)
            if "sub" not in payload or "internal" not in payload or not payload["sub"] or not payload["internal"]:
                return status.HTTP_401_UNAUTHORIZED
            user_id = int(payload["sub"])
        except Exception:
            return status.HTTP_401_UNAUTHORIZED

        try:
            user = None
            with DbSession.use(readonly=True) as db:
                result = db.exec(SqlBuilder.select.table(User).where(User.column("id") == user_id).limit(1))
                user = result.first()
            if not user:
                return status.HTTP_401_UNAUTHORIZED
        except Exception:
            return status.HTTP_401_UNAUTHORIZED

        return user
