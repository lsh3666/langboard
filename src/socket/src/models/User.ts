import { Entity, Column, DeleteDateColumn } from "typeorm";
import BaseModel, { TBigIntString } from "@/core/db/BaseModel";
import { getDatetimeType } from "@/core/db/DbType";

@Entity({ name: "user" })
class User extends BaseModel {
    public static get USER_TYPE(): string {
        return "user";
    }
    public static get UNKNOWN_USER_TYPE(): string {
        return "unknown";
    }
    public static get BOT_TYPE(): string {
        return "bot";
    }
    public static get GROUP_EMAIL_TYPE(): string {
        return "group_email";
    }

    @Column({ type: "varchar" })
    public firstname!: string;

    @Column({ type: "varchar" })
    public lastname!: string;

    @Column({ type: "varchar" })
    public email!: string;

    @Column({ type: "varchar" })
    public username!: string;

    @Column({ type: "varchar" })
    public password!: string;

    @Column({ type: "boolean" })
    public is_admin: bool = false;

    @Column({ type: "varchar" })
    public preferred_lang: string = "en-US";

    @Column({ type: getDatetimeType() })
    public activated_at?: Date;

    @Column({ type: "json", nullable: true })
    public avatar: Record<string, unknown> | null = null;

    @DeleteDateColumn({ type: getDatetimeType() })
    public deleted_at: Date | null = null;

    public get apiResponse() {
        if (this.deleted_at) {
            return this.createUnknownUserApiResponse;
        }

        return {
            type: User.USER_TYPE,
            uid: this.uid,
            firstname: this.firstname,
            lastname: this.lastname,
            email: this.email,
            username: this.username,
            avatar: this.avatar?.path ?? null,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
    }

    public get createUnknownUserApiResponse() {
        return {
            type: User.UNKNOWN_USER_TYPE,
            uid: this.uid,
            firstname: "",
            lastname: "",
            email: "",
            username: "",
        };
    }

    public static async findById(id: TBigIntString): Promise<User | null> {
        const user = await User.createQueryBuilder()
            .select([
                "cast(id as text) as converted_id",
                "firstname",
                "lastname",
                "email",
                "username",
                "avatar",
                "is_admin",
                "preferred_lang",
                "activated_at",
                "deleted_at",
                "created_at",
                "updated_at",
            ])
            .where("id = :id", { id })
            .getRawOne();

        if (!user) {
            return null;
        }

        user.id = user.converted_id;

        return User.create({
            ...user,
        });
    }
}

export default User;
