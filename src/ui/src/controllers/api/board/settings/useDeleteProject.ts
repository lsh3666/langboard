import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IDeleteProjectForm {
    project_uid: string;
}

export interface IDeleteProjectResponse {}

const useDeleteProject = (options?: TMutationOptions<IDeleteProjectForm, IDeleteProjectResponse>) => {
    const { mutate } = useQueryMutation();

    const deleteProject = async (params: IDeleteProjectForm) => {
        const url = Utils.String.format(Routing.API.BOARD.SETTINGS.DELETE_PROJECT, {
            uid: params.project_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });
        return res.data;
    };

    const result = mutate(["delete-project"], deleteProject, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteProject;
