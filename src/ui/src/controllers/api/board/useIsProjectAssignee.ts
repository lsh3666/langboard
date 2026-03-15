import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IIsProjectAssigneeForm {
    project_uid: string;
    assignee_uid: string;
}

export interface IIsProjectAssigneeResponse {
    result: bool;
}

const useIsProjectAssignee = (options?: TMutationOptions<IIsProjectAssigneeForm, IIsProjectAssigneeResponse>) => {
    const { mutate } = useQueryMutation();

    const isProjectAssignee = async (params: IIsProjectAssigneeForm) => {
        const url = Utils.String.format(Routing.API.BOARD.IS_PROJECT_ASSIGNEE, { uid: params.project_uid, assignee_uid: params.assignee_uid });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["is-project-assignee"], isProjectAssignee, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useIsProjectAssignee;
