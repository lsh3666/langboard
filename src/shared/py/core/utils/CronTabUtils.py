from os import environ
from pathlib import Path
from subprocess import run as subprocess_run
from typing import Callable
from zoneinfo import ZoneInfo
from crontab import SPECIALS, CronItem, CronTab, OrderedVariableList
from psutil import process_iter
from ..Env import Env
from ..types import SafeDateTime


class CronTabUtils:
    def __init__(self, file_path: str | Path):
        self.file_path = Path(file_path)

    def reload_cron(self):
        if Env.ENVIRONMENT == "development":
            return
        try:
            for process in process_iter(["pid", "name"]):
                if process.name() != "cron":
                    continue
                process.kill()
            subprocess_run(["crontab", "-r"])
            subprocess_run(["crontab", str(self.file_path)])
            subprocess_run(["cron"])
        except Exception:
            pass

    def convert_valid_interval_str(self, interval_str: str) -> str:
        """Convert a string to a valid cron interval string.

        If the string is not valid, return an empty string.
        """
        try:
            job = CronItem()
            job.setall(interval_str)
            interval_str = str(job.slices)
            special = SPECIALS.get(interval_str.replace("@", ""), None)
            if special:
                return special
            return interval_str
        except Exception:
            return ""

    def get_cron(self):
        if not self.file_path.exists():
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            self.file_path.touch()
        cron = CronTab(user=False, tabfile=str(self.file_path))
        if Env.ENVIRONMENT != "development":
            if cron.env is None:
                cron.env = OrderedVariableList()
            cron.env.update(environ)

        if Env.ENVIRONMENT == "development":
            cron.env = OrderedVariableList()

        return cron

    def create_job(self, cron: CronTab, interval_str: str, command: str, filterable_comment: str) -> bool:
        has_job = False
        for job in cron.find_comment(filterable_comment):
            has_job = True
            break

        if has_job:
            return False

        job = cron.new(
            command=command,
            comment=filterable_comment,
            user="/bin/bash",
        )
        job.setall(interval_str)
        return True

    def remove_job(self, cron: CronTab, filterable_comment: str):
        cron.remove_all(comment=filterable_comment)

    def save_cron(self, cron: CronTab):
        if Env.ENVIRONMENT == "development":
            return
        cron.write()
        self.reload_cron()

    def adjust_interval_for_utc(self, interval_str: str, tz: str | float) -> str:
        if isinstance(tz, str):
            try:
                info = ZoneInfo(tz)
                delta = info.utcoffset(SafeDateTime.now())
                if delta is None:
                    tz = 0.0
                else:
                    tz = delta.total_seconds() / 3600.0
            except Exception:
                tz = 0.0

        if tz == 0.0:
            return interval_str

        real_interval_str = interval_str
        special = SPECIALS.get(interval_str.replace("@", ""), None)
        if special:
            real_interval_str = special

        if real_interval_str.lower() == "@reboot":
            return interval_str

        cron_item = CronItem()
        cron_item.setall(interval_str)
        cron_chunks = real_interval_str.split(" ")

        diff_minutes = int((tz - int(tz)) * 60)
        diff_hours = int(tz)

        if diff_minutes != 0 and cron_item.minutes != "*":
            cron_chunks[0] = self.__adjust_interval_for_utc_chunk(
                str(cron_item.minutes),
                diff_minutes,
                self.__ensure_valid_minute,
                is_minute=True,
            )

        if diff_hours != 0 and cron_item.hours != "*":
            cron_chunks[1] = self.__adjust_interval_for_utc_chunk(
                str(cron_item.hours),
                diff_hours,
                self.__ensure_valid_hour,
                is_minute=False,
            )

        return " ".join(cron_chunks)

    def __adjust_interval_for_utc_chunk(
        self, chunk: str, diff: int, ensure: Callable[[int], int], is_minute: bool
    ) -> str:
        parts = chunk.split(",")
        new_chunks: list[str] = []

        for part in parts:
            if part.startswith("*/"):
                interval = int(part[2:])
                max_interval = 60 if is_minute else 24
                if interval == 1:
                    new_chunks.append(part)
                    continue

                tz_intervals = [time for time in range(0, max_interval, interval)]
                new_intervals = sorted({ensure(time - diff) for time in tz_intervals})
                new_chunks.append(",".join(str(time) for time in new_intervals))
            elif part.count("-") == 1:
                start, end = map(int, part.split("-"))
                new_start = ensure(start - diff)
                new_end = ensure(end - diff)
                new_chunks.append(f"{new_start}-{new_end}")
            else:
                new_value = ensure(int(part) - diff)
                new_chunks.append(str(new_value))
        return ",".join(new_chunks)

    def __ensure_valid_minute(self, minute: int) -> int:
        return ((minute % 60) + 60) % 60

    def __ensure_valid_hour(self, hour: int) -> int:
        return ((hour % 24) + 24) % 24
