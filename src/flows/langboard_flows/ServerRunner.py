from langboard_shared import FastAPIRunner
from langboard_shared.Env import Env
from .Constants import APP_CONFIG_FILE, BASE_DIR
from .core.flows.FlowRunner import FlowRunner


def run():
    FlowRunner.clear_bot_status_cache()
    FastAPIRunner.run(f"{Env.PROJECT_NAME}_flows.AppInstance:app", APP_CONFIG_FILE, BASE_DIR)
