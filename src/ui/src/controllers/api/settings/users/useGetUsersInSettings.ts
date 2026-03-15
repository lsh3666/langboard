import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { useCallback, useRef, useState } from "react";

export interface IUseGetUsersInSettingsProps {
    limit: number;
    isLastPage: bool;
    setIsLastPage: React.Dispatch<React.SetStateAction<bool>>;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    lastCurrentDateRef: React.RefObject<Date>;
}

export interface IGetUsersInSettingsParams {
    page: number;
}

const useGetUsersInSettings = (
    { limit, setPage, lastCurrentDateRef, isLastPage, setIsLastPage }: IUseGetUsersInSettingsProps,
    options?: TMutationOptions
) => {
    const { mutate } = useQueryMutation();
    const [countNewRecords, setCountNewRecords] = useState(0);
    const isFetchingRef = useRef(false);
    const limitRef = useRef(limit);

    const getUsersInSettings = useCallback(
        async (params: IGetUsersInSettingsParams) => {
            if ((isLastPage && params.page) || isFetchingRef.current) {
                return {};
            }

            isFetchingRef.current = true;

            ++params.page;

            const res = await api.get(Routing.API.SETTINGS.USERS.GET_LIST, {
                params: {
                    ...params,
                    refer_time: lastCurrentDateRef.current,
                    limit: limitRef.current,
                },
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            });

            if (res.data.references) {
                for (let i = 0; i < res.data.users.length; ++i) {
                    res.data.users[i].references = res.data.references;
                }
            }

            User.Model.fromArray(res.data.users, true);

            setIsLastPage(res.data.users.length < limitRef.current);
            if (res.data.count_new_records) {
                setCountNewRecords(res.data.count_new_records);
            }

            isFetchingRef.current = false;

            return {};
        },
        [isLastPage, countNewRecords, setPage, setIsLastPage, setCountNewRecords]
    );

    const refresh = useCallback(async () => {
        if (isFetchingRef.current || !countNewRecords) {
            return;
        }

        const curLimit = limitRef.current;
        limitRef.current = countNewRecords;
        lastCurrentDateRef.current = new Date();

        await getUsersInSettings({
            page: 0,
        });

        limitRef.current = curLimit;
        setPage((prev) => prev + Math.ceil(countNewRecords / limitRef.current));
        setCountNewRecords(0);
    }, [setPage, getUsersInSettings, countNewRecords, setCountNewRecords]);

    const checkOutdated = useCallback(
        async (referTime: Date) => {
            if (isFetchingRef.current) {
                return;
            }

            const res = await api.get(Routing.API.SETTINGS.USERS.GET_LIST, {
                params: {
                    only_count: true,
                    refer_time: referTime,
                    page: 1,
                    limit: 1,
                },
                env: {
                    interceptToast: options?.interceptToast,
                } as never,
            });

            if (res.data.count_new_records) {
                setCountNewRecords(res.data.count_new_records);
            }
        },
        [countNewRecords, setCountNewRecords]
    );

    const result = mutate(["get-users-in-settings"], getUsersInSettings, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage, countNewRecords, refresh, checkOutdated };
};

export default useGetUsersInSettings;
