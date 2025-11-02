from mimetypes import guess_type
from fastapi import Path, Response, status
from langboard_shared.core.routing import AppRouter, JsonResponse
from langboard_shared.core.storage import Storage


@AppRouter.api.get("/file/{storage_type}/{storage_name}/{filename}", tags=["General"])
def get_file(storage_type: str = Path(), storage_name: str = Path(), filename: str = Path()) -> Response:
    media_type, _ = guess_type(filename)
    if media_type is None:
        return JsonResponse(status_code=status.HTTP_404_NOT_FOUND)

    file = Storage.get(storage_type, storage_name, filename)
    if file is None:
        return JsonResponse(status_code=status.HTTP_404_NOT_FOUND)

    return Response(content=file, media_type=media_type)
