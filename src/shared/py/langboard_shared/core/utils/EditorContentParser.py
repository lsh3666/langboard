from re import compile, findall
from ..db import EditorContentModel
from .String import concat


DATA_TEXT_FORMAT_DESCRIPTIONS: dict[str, str] = {
    "audio": "Audio url format: <audio src='audio_url' />",
    "date": "Date format: <date>yyyy-MM-dd</date>",
    "file": "File url format: <file name='filename' src='file_url' />",
    "mention": "User mention format: [**@user_or_bot_name**](user_or_bot_uid)",
    "image": "Image url format: ![alt_text](image_url)",
    "video": "Video url format: <video src='video_url' />",
    "uml": "UML format: $$uml\numl_code\n$$",
    "equation": "Equation format: $$\nmath_code\n$$",
    "inline_equation": "Inline equation format: $$math_code$$",
    "internal_link": "Internal link format as obsidian syntax: [[card_or_project_wiki:card_or_wiki_id]]\nExample: [[card:...]], [[project_wiki:...]]",
}


def find_mentioned(editor: EditorContentModel) -> tuple[set[str], dict[str, str]]:
    mention_pattern = compile(r"\[\*\*@([\w-]+)\*\*\]\(([\w]+)\)")
    mentions = findall(mention_pattern, editor.content.replace("\\", ""))

    content = change_date_element(editor)

    result: set[str] = set()
    mentioned_lines: dict[str, str] = {}
    for username, uid in mentions:
        if uid in result:
            continue
        result.add(uid)
        mention_str = concat("[**@", username, "**](", uid, ")")
        content_lines = content.split(mention_str)
        if len(content_lines) < 2:
            mentioned_lines[uid] = mention_str
            continue
        front_lines = content_lines[0].splitlines()
        front_line = front_lines.pop() if front_lines else ""
        last_lines = content_lines[1].splitlines()
        last_line = last_lines.pop(0) if last_lines else ""
        mentioned_lines[uid] = f"{front_line}{mention_str}{last_line}"

    return result, mentioned_lines


def change_date_element(editor: EditorContentModel) -> str:
    if not editor.content:
        return ""

    content = editor.content
    date_regex = compile(r"<date>(.*?)</date>")
    date_matches = findall(date_regex, content)
    for date in date_matches:
        date_str = f"<date>{date}</date>"
        content = content.replace(date_str, date)
    return content
