import { TRoleAllGranted } from "@/core/models/roles/base";

export enum EAction {
    Read = "read",
    Create = "create",
    Update = "update",
    Delete = "delete",
}

export type TActions = EAction | keyof typeof EAction | TRoleAllGranted;
