import { TRoleAllGranted } from "@/core/models/roles/base";

export enum EAction {
    Read = "read",
    Update = "update",
    CardWrite = "card_write",
    CardUpdate = "card_update",
    CardDelete = "card_delete",
}

export type TActions = EAction | keyof typeof EAction | TRoleAllGranted;
