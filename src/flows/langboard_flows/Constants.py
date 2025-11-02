from os.path import dirname
from pathlib import Path
from sys import executable
from langboard_shared.core.logger import Logger
from langboard_shared.Env import Env


Logger.main = Logger.use("flows")


# Directory
BASE_DIR = Path(dirname(__file__)) if not Env.IS_EXECUTABLE else Path(dirname(executable))

# URL
HOST = Env.get_from_env("FLOWS_HOST", "localhost")
PORT = int(Env.get_from_env("FLOWS_PORT", "5019"))

# App Config
APP_CONFIG_FILE = Env.DATA_DIR / "flows_config.json"


if Env.MAIN_DATABASE_URL.startswith("sqlite"):
    sqlite_path = Env.MAIN_DATABASE_URL.split(":///")[-1]
    Env.update_env("MAIN_DATABASE_URL", f"sqlite:///{Env.ROOT_DIR / sqlite_path}")
if Env.READONLY_DATABASE_URL.startswith("sqlite"):
    sqlite_path = Env.MAIN_DATABASE_URL.split(":///")[-1]
    Env.update_env("READONLY_DATABASE_URL", f"sqlite:///{Env.ROOT_DIR / sqlite_path}")
