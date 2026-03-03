export enum ESocketTopic {
    Dashboard = "dashboard",
    Board = "board",
    BoardCard = "board_card",
    BoardWiki = "board_wiki",
    BoardWikiPrivate = "board_wiki_private",
    BoardSettings = "board_settings",
    User = "user",
    UserPrivate = "user_private",
    AppSettings = "app_settings",
    OllamaManager = "ollama_manager",
    Global = "global",
    None = "none",
}

export enum ESettingSocketTopicID {
    // Api Key role management
    ApiKey = "api_key",

    // Setting role management
    User = "user",
    Bot = "bot",
    InternalBot = "internal_bot",
    GlobalRelationship = "global_relationship",
    Webhook = "webhook",
    Ollama = "ollama",

    // MCP Server management
    McpToolGroup = "mcp_tool_group",
}

export const GLOBAL_TOPIC_ID = "all" as const;
export const NONE_TOPIC_ID = "none" as const;
