/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Button, DataTable } from "@/components/base";
import { TDataTableColumn } from "@/components/base/DataTable/types";
import { TGetListForm } from "@/controllers/api/shared/types";
import { IUseGetPaginatedListProps } from "@/controllers/api/shared/useGetPaginatedList";
import { BaseModel } from "@/core/models/Base";
import { ModelRegistry, TCreatedAtModel, TCreatedAtModelName } from "@/core/models/ModelRegistry";
import { PaginatedListProvider, usePaginatedList } from "@/core/providers/PaginatedListProvider";
import { Utils } from "@langboard/core/utils";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export interface IPaginatedTableProps<TModelName extends TCreatedAtModelName> {
    form: TGetListForm<TModelName>;
    modelFilter: (model: TCreatedAtModel<TModelName>) => bool;
    prepareData?: (
        records: Omit<TCreatedAtModel<IUseGetPaginatedListProps<TModelName>["form"]["listType"]>, keyof Omit<BaseModel<any>, "uid">>[],
        data: any
    ) => void;
    columns: TDataTableColumn<TCreatedAtModel<TModelName>>[];
}

const PAGE_LIMIT = 15;

function PaginatedTable<TModelName extends TCreatedAtModelName>({ form, modelFilter, prepareData, ...props }: IPaginatedTableProps<TModelName>) {
    const models = ModelRegistry[form.listType].Model.useModels(modelFilter as any) as TCreatedAtModel<TModelName>[];

    return (
        <PaginatedListProvider models={models} form={form} limit={PAGE_LIMIT} prepareData={prepareData}>
            <PaginatedTableDisplay {...props} />
        </PaginatedListProvider>
    );
}

interface IPaginatedTableDisplayProps<TModelName extends TCreatedAtModelName> {
    columns: TDataTableColumn<TCreatedAtModel<TModelName>>[];
}

function PaginatedTableDisplay<TModelName extends TCreatedAtModelName>({ columns }: IPaginatedTableDisplayProps<TModelName>) {
    const [t] = useTranslation();
    const { isFetchingRef, models, refreshList, checkOutdated, isRefreshing, status, countNewRecords } = usePaginatedList<TModelName>();
    const throttledTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const refreshButtonIdRef = useRef(Utils.String.Token.shortUUID());
    const handlePaginated = () => {
        if (isFetchingRef.current || isRefreshing) {
            return;
        }

        if (throttledTimeoutRef.current) {
            clearTimeout(throttledTimeoutRef.current);
            throttledTimeoutRef.current = null;
        }

        throttledTimeoutRef.current = setTimeout(() => {
            checkOutdated();

            if (throttledTimeoutRef.current) {
                clearTimeout(throttledTimeoutRef.current);
                throttledTimeoutRef.current = null;
            }
        }, 2000);
    };

    useEffect(() => {
        const checkEvent = (e: Event) => {
            const target = e.target;
            if (Utils.Type.isElement(target) && target.id === refreshButtonIdRef.current) {
                return;
            }

            handlePaginated();
        };

        window.addEventListener("focus", checkEvent);
        window.addEventListener("touchstart", checkEvent);
        window.addEventListener("mousedown", checkEvent);

        return () => {
            window.removeEventListener("focus", checkEvent);
            window.removeEventListener("touchstart", checkEvent);
            window.removeEventListener("mousedown", checkEvent);
        };
    }, []);

    return (
        <Box position="relative">
            {status === "success" && !isRefreshing && countNewRecords > 0 && !isRefreshing && (
                <Button id={refreshButtonIdRef.current} onClick={refreshList} size="sm" className="absolute left-1/2 top-1 z-50 -translate-x-1/2">
                    {t("datatable.{count} New Records", { count: countNewRecords })}
                </Button>
            )}
            <DataTable
                columns={columns}
                data={models}
                totalRecords={models.length}
                searchable
                showPagination
                loading={status !== "success" || isRefreshing}
                onPaginated={handlePaginated}
            />
        </Box>
    );
}

export default PaginatedTable;
