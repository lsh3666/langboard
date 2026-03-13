import { ROLE_ALL_GRANTED } from "@/core/models/roles/base";
import { useCallback } from "react";

const useRoleActionFilter = <T extends string>(userActions: T[]) => {
    const hasRoleAction = useCallback(
        (...actions: T[]) => {
            if (!userActions?.length) {
                return false;
            }

            if (userActions.includes(ROLE_ALL_GRANTED as T)) {
                return true;
            }

            for (let i = 0; i < actions.length; ++i) {
                if (userActions.includes(actions[i])) {
                    return true;
                }
            }

            return false;
        },
        [userActions]
    );

    return { hasRoleAction };
};

export default useRoleActionFilter;
