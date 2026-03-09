import DropdownMenu from "@/components/base/DropdownMenu";
import IconComponent from "@/components/base/IconComponent";
import Toast from "@/components/base/Toast";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import useDeleteProjectChatSession from "@/controllers/api/board/chat/useDeleteProejctChatSession";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ChatMessageModel, ChatSessionModel } from "@/core/models";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

function ChatSessionMoreMenuDeleteSession({ session }: { session: ChatSessionModel.TModel }) {
    const { projectUID, currentSessionUID, setCurrentSessionUID } = useBoardChat();
    const { isValidating, setIsValidating, setIsOpened } = useMoreMenu();
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { mutate } = useDeleteProjectChatSession();

    const deleteSession = useCallback(() => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        mutate(
            { uid: projectUID, session_uid: session.uid },
            {
                onSuccess: () => {
                    if (currentSessionUID === session.uid) {
                        setCurrentSessionUID(() => undefined);
                    }
                    setIsOpened(false);
                    ChatMessageModel.Model.deleteModels((model) => model.chat_session_uid === session.uid);
                    ChatSessionModel.Model.deleteModel((model) => model.uid === session.uid);
                    Toast.Add.success(t("successes.Chat session deleted successfully."));
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    });

                    handle(error);
                },
            }
        );
    }, [projectUID, currentSessionUID, isValidating, setCurrentSessionUID]);

    return (
        <DropdownMenu.Item className="gap-1 font-semibold text-destructive focus:text-destructive" onClick={deleteSession} disabled={isValidating}>
            <IconComponent icon="trash-2" size="4" strokeWidth="2" />
            {t("project.Delete session")}
        </DropdownMenu.Item>
    );
}

export default ChatSessionMoreMenuDeleteSession;
