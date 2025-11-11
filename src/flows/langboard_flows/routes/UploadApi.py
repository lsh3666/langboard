from pathlib import Path
from typing import Annotated
from uuid import uuid4
from fastapi import Depends, File, HTTPException, UploadFile, status
from langboard_shared.core.routing import AppRouter
from langboard_shared.core.utils.String import generate_random_string
from langflow.services.deps import get_settings_service, get_storage_service
from ..core.schema import UploadFileResponse


@AppRouter.api.post("/api/v2/files", status_code=status.HTTP_201_CREATED)
async def upload_user_file(
    file: Annotated[UploadFile, File(...)],
    storage_service=Depends(get_storage_service),
    settings_service=Depends(get_settings_service),
) -> UploadFileResponse:
    try:
        max_file_size_upload = settings_service.settings.max_file_size_upload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Settings error: {e}") from e

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if file.size > max_file_size_upload * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File size is larger than the maximum file size {max_file_size_upload}MB.",
        )

    try:
        file_id = uuid4()
        file_content = await file.read()

        file_extension = "." + file.filename.split(".")[-1] if file.filename and "." in file.filename else ""
        anonymized_file_name = f"{file_id!s}{file_extension}"

        folder = generate_random_string(16)
        await storage_service.save_file(flow_id=folder, file_name=anonymized_file_name, data=file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}") from e

    new_filename = file.filename
    try:
        root_filename, _ = new_filename.rsplit(".", 1)
    except ValueError:
        root_filename, _ = new_filename, ""

    # Compute the file size based on the path
    file_size = await storage_service.get_file_size(flow_id=folder, file_name=anonymized_file_name)

    # Compute the file path
    file_path = f"{folder}/{anonymized_file_name}"

    return UploadFileResponse(id=file_id, name=root_filename, path=Path(file_path), size=file_size)
