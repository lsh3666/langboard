import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IUnassignProjectAssigneeForm {
    project_uid: string;
    assignee_uid: string;
}

export interface IUnassignProjectAssigneeResponse {}

const useUnassignProjectAssignee = (options?: TMutationOptions<IUnassignProjectAssigneeForm, IUnassignProjectAssigneeResponse>) => {
    const { mutate } = useQueryMutation();

    const unassignProjectAssignee = async (params: IUnassignProjectAssigneeForm) => {
        const url = Utils.String.format(Routing.API.BOARD.UNASSIGN_ASSIGNEE, { uid: params.project_uid, assignee_uid: params.assignee_uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return res.data;
    };

    const result = mutate(["unassign-project-assignee"], unassignProjectAssignee, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUnassignProjectAssignee;
