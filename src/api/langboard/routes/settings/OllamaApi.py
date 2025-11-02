import requests
from fastapi import status
from langboard_shared.core.caching import Cache
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.Env import Env
from .Form import OllamaModelForm


_OLLAMA_PULLING_MODELS_CACHE_KEY = "ollama:pulling:models"


@AppRouter.api.get(
    "/settings/ollama/models",
    tags=["AppSettings"],
    responses=(OpenApiSchema().auth().forbidden().get()),
)
@AuthFilter.add("admin")
async def get_ollama_models() -> JsonResponse:
    if not Env.OLLAMA_API_URL:
        return JsonResponse(content={"models": [], "pulling_models": {}})

    try:
        response = requests.get(f"{Env.OLLAMA_API_URL}/api/tags")
        response.raise_for_status()
        data = response.json()
        data["pulling_models"] = []

        pulling_models: dict | None = await Cache.get(_OLLAMA_PULLING_MODELS_CACHE_KEY)
        if pulling_models:
            for model in data.get("models", []):
                if model["name"] in pulling_models:
                    pulling_models.pop(model["name"])

            await Cache.set(_OLLAMA_PULLING_MODELS_CACHE_KEY, pulling_models, ttl=24 * 60 * 60)
            data["pulling_models"] = pulling_models

        return JsonResponse(content=data)
    except Exception:
        return JsonResponse(content={"models": [], "pulling_models": {}})


@AppRouter.api.post(
    "/settings/ollama/model/details",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF9000).err(404, ApiErrorCode.NF9001).get(),
)
@AuthFilter.add("admin")
async def get_ollama_model_details(form: OllamaModelForm) -> JsonResponse:
    if not Env.OLLAMA_API_URL:
        return JsonResponse(ApiErrorCode.NF9000, status_code=status.HTTP_404_NOT_FOUND)

    try:
        response = requests.post(f"{Env.OLLAMA_API_URL}/api/show", json={"model": form.model})
        response.raise_for_status()
        data = response.json()
        return JsonResponse(content=data)
    except Exception:
        return JsonResponse(ApiErrorCode.NF9001, status_code=status.HTTP_404_NOT_FOUND)


@AppRouter.api.get(
    "/settings/ollama/models/running",
    tags=["AppSettings"],
    responses=(OpenApiSchema().auth().forbidden().get()),
)
@AuthFilter.add("admin")
async def get_ollama_running_models() -> JsonResponse:
    if not Env.OLLAMA_API_URL:
        return JsonResponse(content={"models": []})

    try:
        response = requests.get(f"{Env.OLLAMA_API_URL}/api/ps")
        response.raise_for_status()
        data = response.json()
        return JsonResponse(content=data)
    except Exception:
        return JsonResponse(content={"models": []})
