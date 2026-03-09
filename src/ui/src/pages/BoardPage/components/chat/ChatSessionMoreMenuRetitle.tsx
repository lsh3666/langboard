import Floating from "@/components/base/Floating";
import IconComponent from "@/components/base/IconComponent";
import Toast from "@/components/base/Toast";
import MoreMenu from "@/components/MoreMenu";
import useUpdateProjectChatSession from "@/controllers/api/board/chat/useUpdateProjectChatSession";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ChatSessionModel } from "@/core/models";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

function ChatSessionMoreMenuRetitle({ session }: { session: ChatSessionModel.TModel }) {
    const { projectUID } = useBoardChat();
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { mutate } = useUpdateProjectChatSession();
    const inputRef = useRef<HTMLInputElement>(null);
    const title = session.useField("title");

    const rename = (endCallback: (shouldClose: bool) => void) => {
        const newTitle = inputRef.current?.value?.trim();
        if (!newTitle) {
            inputRef.current?.focus();
            return;
        }

        mutate(
            { uid: projectUID, session_uid: session.uid, title: newTitle },
            {
                onSuccess: () => {
                    session.title = newTitle;
                    Toast.Add.success(t("successes.Chat session renamed successfully."));
                    endCallback(true);
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
    };

    return (
        <MoreMenu.PopoverItem
            modal
            contentProps={{ align: "center" }}
            menuName={
                <>
                    <IconComponent icon="pencil" size="4" strokeWidth="2" />
                    {t("project.Retitle")}
                </>
            }
            triggerProps={{ className: "gap-1 font-semibold" }}
            onSave={rename}
        >
            <Floating.LabelInput label={t("project.Session name")} ref={inputRef} defaultValue={title} />
        </MoreMenu.PopoverItem>
    );
}

export default ChatSessionMoreMenuRetitle;
