from fastapi import Depends, status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.domain.models import (
    ChatHistory,
    ChatSession,
    ChatTemplate,
    Project,
    ProjectChatSession,
    ProjectRole,
    User,
)
from langboard_shared.domain.models.ProjectRole import ProjectRoleAction
from langboard_shared.domain.services import DomainService
from langboard_shared.filter import RoleFilter
from langboard_shared.publishers import ProjectPublisher
from langboard_shared.security import Auth, RoleFinder
from .forms import ChatHistoryPagination, CreateChatTemplate, UpdateChatTemplate, UpdateProjectChatSessionForm


@AppRouter.api.get(
    "/board/{project_uid}/chat/sessions",
    tags=["Board.Chat"],
    responses=OpenApiSchema().suc({"sessions": [ChatSession]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def get_project_chat_sessions(
    project_uid: str,
    user: User = Auth.scope("user"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    sessions = await service.chat.get_api_session_list(user, ProjectChatSession, project_uid)

    return JsonResponse(content={"sessions": sessions})


@AppRouter.api.get(
    "/board/{project_uid}/chat/session/{session_uid}",
    tags=["Board.Chat"],
    responses=OpenApiSchema().suc({"histories": [ChatHistory]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def get_project_chat_histories(
    project_uid: str,
    session_uid: str,
    query: ChatHistoryPagination = Depends(),
    user: User = Auth.scope("user"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    result = await service.chat.get_session_by_filterable(ProjectChatSession, session_uid, project_uid)
    if not result or result[0].user_id != user.id:
        return JsonResponse(content={"histories": []})
    chat_session, session = result

    histories = await service.chat.get_api_history_list(user, chat_session, ProjectChatSession, session, query)

    return JsonResponse(content={"histories": histories})


@AppRouter.api.put(
    "/board/{project_uid}/chat/session/{session_uid}",
    tags=["Board.Chat"],
    responses=OpenApiSchema().auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def update_project_chat_session(
    project_uid: str,
    session_uid: str,
    form: UpdateProjectChatSessionForm,
    user: User = Auth.scope("user"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    session = await service.chat.get_session_by_filterable(ProjectChatSession, session_uid, project_uid)
    if not session or session[0].user_id != user.id:
        return JsonResponse(content=ApiErrorCode.NF2021, status_code=status.HTTP_404_NOT_FOUND)
    chat_session, _ = session

    await service.chat.update_session(chat_session, form.title)

    return JsonResponse()


@AppRouter.api.delete(
    "/board/{project_uid}/chat/session/{session_uid}",
    tags=["Board.Chat"],
    responses=OpenApiSchema().auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def delete_project_chat_session(
    project_uid: str,
    session_uid: str,
    user: User = Auth.scope("user"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    session = await service.chat.get_session_by_filterable(ProjectChatSession, session_uid, project_uid)
    if not session or session[0].user_id != user.id:
        return JsonResponse(content={"histories": []})

    chat_session, _ = session

    await service.chat.delete_session(chat_session)

    return JsonResponse()


@AppRouter.api.get(
    "/board/{project_uid}/chat/templates",
    tags=["Board.Chat"],
    responses=OpenApiSchema().suc({"templates": [ChatTemplate]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def get_chat_templates(project_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    templates = await service.chat.get_api_template_list(Project.__tablename__, project_uid)

    return JsonResponse(content={"templates": templates})


@AppRouter.api.post(
    "/board/{project_uid}/chat/template",
    tags=["Board.Chat"],
    responses=OpenApiSchema(201).auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def create_chat_template(
    project_uid: str, form: CreateChatTemplate, service: DomainService = DomainService.scope()
) -> JsonResponse:
    project = await service.project.get_by_id_like(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    template = await service.chat.create_template(project, form.name, form.template)

    await ProjectPublisher.chat_template_created(project, {"template": template.api_response()})

    return JsonResponse(status_code=status.HTTP_201_CREATED)


@AppRouter.api.put(
    "/board/{project_uid}/chat/template/{template_uid}",
    tags=["Board.Chat"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2018).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def update_chat_template(
    project_uid: str,
    template_uid: str,
    form: UpdateChatTemplate,
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    project = await service.project.get_by_id_like(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    result = await service.chat.update_template(template_uid, form.name, form.template)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        return JsonResponse()

    template, model = result
    await ProjectPublisher.chat_template_updated(project, template, model)

    return JsonResponse()


@AppRouter.api.delete(
    "/board/{project_uid}/chat/template/{template_uid}",
    tags=["Board.Chat"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2018).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def delete_chat_template(
    project_uid: str, template_uid: str, service: DomainService = DomainService.scope()
) -> JsonResponse:
    project = await service.project.get_by_id_like(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    result = await service.chat.delete_template(template_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    await ProjectPublisher.chat_template_deleted(project, template_uid)

    return JsonResponse()
