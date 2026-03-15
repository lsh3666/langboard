import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

interface IBaseChangeProjectLabelDetailsForm {
    project_uid: string;
    label_uid: string;
}

interface IDetails {
    name?: string;
    color?: string;
    description?: string;
}

type TChangeableDetail = keyof IDetails;

export type TChangeProjectLabelDetailsForm<TDetail extends TChangeableDetail> = IBaseChangeProjectLabelDetailsForm & Pick<IDetails, TDetail>;
export type TChangeProjectLabelDetailsResponse<TDetail extends TChangeableDetail> = Required<Pick<IDetails, TDetail>>;

const useChangeProjectLabelDetails = <TDetail extends TChangeableDetail>(
    type: TDetail,
    options?: TMutationOptions<TChangeProjectLabelDetailsForm<TDetail>, TChangeProjectLabelDetailsResponse<TDetail>>
) => {
    const { mutate } = useQueryMutation();

    const changeProjectLabelDetails = async (params: TChangeProjectLabelDetailsForm<TDetail>) => {
        const url = Utils.String.format(Routing.API.BOARD.SETTINGS.LABEL.CHANGE_DETAILS, { uid: params.project_uid, label_uid: params.label_uid });
        const res = await api.put(
            url,
            {
                [type]: params[type],
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            }
        );

        return res.data;
    };

    const result = mutate(["change-project-label-details"], changeProjectLabelDetails, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectLabelDetails;
