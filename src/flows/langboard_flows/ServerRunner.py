from asyncio import run as run_async
from langboard_shared import FastAPIRunner
from langboard_shared.core.caching import Cache
from langboard_shared.Env import Env
from .Constants import APP_CONFIG_FILE, BASE_DIR


def run():
    run_async(Cache.delete("bot.status.map"))
    FastAPIRunner.run(f"{Env.PROJECT_NAME}_flows.AppInstance:app", APP_CONFIG_FILE, BASE_DIR)
