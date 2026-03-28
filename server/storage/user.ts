
import { users, type User, type UpsertUser } from "../../shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export interface IUserStorage {
    getUser(id: string): Promise<User | undefined>;
    upsertUser(user: UpsertUser): Promise<User>;
}

export class UserStorage implements IUserStorage {
    async getUser(id: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || undefined;
    }

    async upsertUser(user: UpsertUser): Promise<User> {
        const [upserted] = await db
            .insert(users)
            .values(user)
            .onConflictDoUpdate({
                target: users.id,
                set: user,
            })
            .returning();
        return upserted;
    }
}
