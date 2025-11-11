from pydantic import BaseModel


class FileModel(BaseModel):
    storage_type: str
    storage_name: str
    original_filename: str
    filename: str
    path: str
