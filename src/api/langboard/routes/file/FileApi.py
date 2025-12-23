from mimetypes import guess_type
from fastapi import Path, Response
from langboard_shared.core.routing import ApiException, AppRouter
from langboard_shared.core.storage import Storage


@AppRouter.api.get("/file/{storage_type}/{storage_name}/{filename}", tags=["General"])
def get_file(storage_type: str = Path(), storage_name: str = Path(), filename: str = Path()) -> Response:
    media_type, _ = guess_type(filename)
    if media_type is None:
        raise ApiException.NotFound_404()

    file = Storage.get(storage_type, storage_name, filename)
    if file is None:
        raise ApiException.NotFound_404()

    return Response(content=file, media_type=media_type)
