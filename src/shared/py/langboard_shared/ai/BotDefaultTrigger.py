from enum import Enum


class BotDefaultTrigger(Enum):
    BotCreated = "bot_created"
    BotMentioned = "bot_mentioned"
    BotCronScheduled = "bot_cron_scheduled"
