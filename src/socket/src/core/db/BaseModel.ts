/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDatetimeType } from "@/core/db/DbType";
import SnowflakeID from "@/core/db/SnowflakeID";
import { BaseEntity, DeepPartial, Column, InsertResult, SaveOptions, PrimaryColumn } from "typeorm";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";

export type TBigIntString = string;

export const ROLE_ALL_GRANTED = "*";

export type TRoleAllGranted = typeof ROLE_ALL_GRANTED;
export interface IEditorContentModel {
    content: string;
}

const bigIntTransformer = {
    to: (value: any): TBigIntString => value?.toString() ?? null,
    from: (value: any): TBigIntString => value?.toString() ?? null,
};

export const BigIntColumn = (isPrimary: bool) =>
    isPrimary ? PrimaryColumn("bigint", { transformer: [bigIntTransformer] }) : Column("bigint", { transformer: [bigIntTransformer] });

export const CsvColumn = () =>
    Column({
        type: "text",
        transformer: {
            to: (value: string[]) => value.join(","),
            from: (value: string) => value.split(","),
        },
    });

abstract class BaseModel extends BaseEntity {
    @BigIntColumn(true)
    public id!: TBigIntString;

    @Column({ type: getDatetimeType() })
    public created_at: Date = new Date();

    @Column({ type: getDatetimeType() })
    public updated_at: Date = new Date();

    public get uid(): string {
        return new SnowflakeID(this.id).toShortCode();
    }

    public static create<T extends BaseModel>(
        this: {
            new (): T;
        } & typeof BaseModel
    ): T;
    public static create<T extends BaseModel>(
        this: {
            new (): T;
        } & typeof BaseModel,
        entityLike: DeepPartial<Omit<T, "id">>
    ): T;
    public static create<T extends BaseModel>(
        this: {
            new (): T;
        } & typeof BaseModel,
        entityLikeArray: DeepPartial<Omit<T, "id">>[]
    ): T[];
    public static create(this: any, entityLike?: DeepPartial<any> | DeepPartial<any>[]): any {
        return super.create(entityLike);
    }

    public static insert<T extends BaseEntity>(
        this: {
            new (): T;
        } & typeof BaseEntity,
        entity: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[]
    ): Promise<InsertResult> {
        (entity as any).id = new SnowflakeID().toString();
        return super.insert(entity);
    }

    public async save(options?: SaveOptions): Promise<this> {
        let id;
        if (!this.id) {
            id = new SnowflakeID().toString();
            this.id = id;
        } else {
            id = this.id;
        }
        this.updated_at = new Date();
        const result = await super.save(options);
        result.id = id;
        return result;
    }
}

export default BaseModel;
