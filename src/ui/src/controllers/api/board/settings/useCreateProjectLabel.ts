import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectLabel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface ICreateProjectLabelForm {
    project_uid: string;
    name: string;
    color: string;
    description: string;
}

export interface ICreateProjectLabelResponse {
    label: ProjectLabel.Interface;
}

const useCreateProjectLabel = (options?: TMutationOptions<ICreateProjectLabelForm, ICreateProjectLabelResponse>) => {
    const { mutate } = useQueryMutation();

    const createProjectLabel = async (params: ICreateProjectLabelForm) => {
        const url = Utils.String.format(Routing.API.BOARD.SETTINGS.LABEL.CREATE, {
            uid: params.project_uid,
        });
        const res = await api.post(
            url,
            {
                name: params.name,
                color: params.color,
                description: params.description,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["create-project-label"], createProjectLabel, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateProjectLabel;
