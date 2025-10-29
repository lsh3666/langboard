from time import sleep
from typing import cast
from core.bootstrap import BaseCommand, Commander
from core.Env import Env
from core.FastAPIAppConfig import FastAPIAppConfig
from pydantic import SecretStr
from .commands.DbUpgradeCommand import DbUpgradeCommand, DbUpgradeCommandOptions
from .commands.RunCommand import RunCommandOptions
from .Constants import APP_CONFIG_FILE, HOST
from .core.broadcast import ensure_initialized
from .Loader import ModuleLoader
from .ServerRunner import run as run_server


ensure_initialized()


def execute():
    commander = Commander()

    modules = ModuleLoader.load("commands", "Command", BaseCommand, log=False)
    for module in modules.values():
        for command in module:
            if not command.__name__.endswith("Command") or (Env.IS_EXECUTABLE and command.is_only_in_dev()):  # type: ignore
                continue
            commander.add_commands(command(run_app=_run_app))  # type: ignore

    commander.run()
    return 0


def _run_app(options: RunCommandOptions):
    ssl_options = options.create_ssl_options() if options.ssl_keyfile else None

    if not options.worker:
        DbUpgradeCommand().execute(DbUpgradeCommandOptions())
        _init_internal_bots()
        _init_admin()

    app_config = FastAPIAppConfig(APP_CONFIG_FILE)
    app_config.create(
        host=HOST,
        port=Env.API_PORT,
        uds=options.uds,
        lifespan=options.lifespan,
        ssl_options=ssl_options,
        workers=1,
        timeout_keep_alive=options.timeout_keep_alive,
        healthcheck_interval=options.healthcheck_interval,
        watch=options.watch,
    )

    try:
        run_server()
    except KeyboardInterrupt:
        return


def _init_internal_bots():
    from core.db import DbSession, SqlBuilder
    from models import InternalBot
    from models.BaseBotModel import BotPlatform, BotPlatformRunningType
    from models.InternalBot import InternalBotType

    settings = []
    with DbSession.use(readonly=True) as db:
        result = db.exec(
            SqlBuilder.select.column(InternalBot.bot_type).where(
                InternalBot.column("bot_type").in_(
                    [InternalBotType.ProjectChat, InternalBotType.EditorChat, InternalBotType.EditorCopilot]
                )
                & (InternalBot.is_default == True)  # noqa: E712
            )
        )
        settings = result.all()

    if len(settings) == 3:
        return

    with DbSession.use(readonly=False) as db:
        for bot_type in [InternalBotType.ProjectChat, InternalBotType.EditorChat, InternalBotType.EditorCopilot]:
            if bot_type in settings:
                continue

            display_name = bot_type.value.replace("_", " ").title()
            setting = InternalBot(
                bot_type=bot_type,
                display_name=display_name,
                platform=BotPlatform.Default,
                platform_running_type=BotPlatformRunningType.Default,
                is_default=True,
            )
            db.insert(setting)


def _init_admin():
    from core.db import DbSession, SqlBuilder
    from core.types import SafeDateTime
    from models import User, UserProfile

    user_count = 0
    with DbSession.use(readonly=True) as db:
        result = db.exec(SqlBuilder.select.count(User, User.id).where(User.is_admin == True))  # noqa
        user_count = result.first()

    if user_count:
        return

    admin = User(
        firstname="Admin",
        lastname="User",
        email=Env.ADMIN_EMAIL,
        password=cast(SecretStr, Env.ADMIN_PASSWORD),
        username="admin",
        is_admin=True,
        activated_at=SafeDateTime.now(),
    )
    with DbSession.use(readonly=False) as db:
        db.insert(admin)

    if admin.is_new():
        _init_admin()
        return

    admin_profile = None
    while not admin_profile:
        with DbSession.use(readonly=False) as db:
            admin_profile = UserProfile(user_id=admin.id, industry="", purpose="")
            db.insert(admin_profile)
        sleep(1)
