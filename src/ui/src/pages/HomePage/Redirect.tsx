import { QUERY_NAMES } from "@/constants";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ROUTES } from "@/core/routing/constants";
import { useEffect } from "react";
import { To } from "react-router";

function Redirect(): React.JSX.Element {
    const navigate = usePageNavigateRef();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const values = Object.values(QUERY_NAMES);
        let isRedirected = false;
        for (let i = 0; i < values.length; ++i) {
            const param = values[i];
            if (param === QUERY_NAMES.REDIRECT) {
                continue;
            }

            const paramValue = params.get(param);
            if (!paramValue) {
                continue;
            }

            const to: To = {
                search: params.toString(),
            };
            switch (param) {
                case QUERY_NAMES.SUB_EMAIL_VERIFY_TOKEN:
                    to.pathname = ROUTES.ACCOUNT.EMAILS.VERIFY;
                    break;
                case QUERY_NAMES.SIGN_UP_ACTIVATE_TOKEN:
                    to.pathname = ROUTES.SIGN_UP.ACTIVATE;
                    break;
                case QUERY_NAMES.RECOVERY_TOKEN:
                    to.pathname = ROUTES.ACCOUNT_RECOVERY.RESET;
                    break;
                case QUERY_NAMES.PROJCT_INVITATION_TOKEN:
                    to.pathname = ROUTES.BOARD.INVITATION;
                    break;
                case QUERY_NAMES.BOARD:
                    to.pathname = ROUTES.BOARD.MAIN(paramValue);
                    delete to.search;
                    break;
                case QUERY_NAMES.BOARD_CARD: {
                    const board = params.get(QUERY_NAMES.BOARD_CARD_CHUNK);
                    if (!board) {
                        continue;
                    }

                    to.pathname = ROUTES.BOARD.CARD(board, param);
                    delete to.search;
                    break;
                }
            }

            if (!to.pathname) {
                continue;
            }

            isRedirected = true;
            navigate(to);
            break;
        }

        if (!isRedirected) {
            navigate(ROUTES.SIGN_IN.EMAIL);
        }
    }, []);

    return <></>;
}

export default Redirect;
