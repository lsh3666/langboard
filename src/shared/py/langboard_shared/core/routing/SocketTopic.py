from enum import Enum


GLOBAL_TOPIC_ID = "all"
NONE_TOPIC_ID = "none"


class SocketTopic(Enum):
    Dashboard = "dashboard"
    Board = "board"
    BoardCard = "board_card"
    BoardWiki = "board_wiki"
    BoardWikiPrivate = "board_wiki_private"
    BoardSettings = "board_settings"
    User = "user"
    UserPrivate = "user_private"
    AppSettings = "app_settings"
    OllamaManager = "ollama_manager"
    Global = "global"
    NoneTopic = "none"
