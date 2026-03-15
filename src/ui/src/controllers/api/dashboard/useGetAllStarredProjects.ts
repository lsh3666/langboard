import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";

export interface IGetAllStarredProjectsResponse {
    projects: Project.TModel[];
}

const useGetAllStarredProjects = (options?: TQueryOptions<IGetAllStarredProjectsResponse>) => {
    const { query } = useQueryMutation();

    const getAllStarredProjects = async () => {
        const res = await api.get(Routing.API.DASHBOARD.ALL_STARRED_PROJECTS, {
            env: {
                interceptToast: options?.interceptToast,
            } as never,
        });

        return {
            projects: Project.Model.fromArray(res.data.projects, true),
        };
    };

    const result = query(["get-all-starred-projects"], getAllStarredProjects, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useGetAllStarredProjects;
