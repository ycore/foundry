// https://github.com/Sairyss/domain-driven-hexagon/blob/master/src/libs/ddd/repository.port.ts
// https://github.com/Sairyss/domain-driven-hexagon
// https://medium.com/@joaojbs199/transactions-with-ddd-and-repository-pattern-in-typescript-a-guide-to-good-implementation-part-3-3a7d7c984eca
// https://blog.cloudflare.com/whats-new-with-d1/
// D1_ERROR: To execute a transaction, please use the state.storage.transaction() or state.storage.transactionSync() APIs instead of the SQL BEGIN TRANSACTION or SAVEPOINT statements.
// The JavaScript API is safer because it will automatically roll back on exceptions, and because it interacts correctly with Durable Objects' automatic atomic write coalescing.
// https://everythingcs.dev/blog/cloudflare-d1-workers-rest-api-crud-operation/
// https://developers.cloudflare.com/d1/tutorials/import-to-d1-with-rest-api/
import { desc, eq } from 'drizzle-orm';
import { passwords, users } from '../config/db/schema.js';
import { comparePassword, hashPassword } from '../utils/auth-hash.js';
import { AuthError } from '../utils/error-auth.js';
export const authRepository = {
    findOrCreate: async (context, credentials, canExist = false) => {
        const db = context.db;
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        let [_, user] = await authRepository.findOneEmail(context, credentials.email);
        if (user && !canExist) {
            return [new AuthError({ kind: 'DB USER EXISTS', message: `User with ${credentials.email} exists.` }), undefined];
        }
        if (!user) {
            try {
                // on initial create, users.emailVerified determines verification status, password.verified is therefore initially true
                // **** NON-transaction create
                [user] = await db.insert(users).values({ email: credentials.email }).returning({ id: users.id, email: users.email, emailVerified: users.emailVerified });
                if (!user) {
                    return [new AuthError({ kind: 'DB USER CREATE FAILED', message: 'User create failed' }), undefined];
                }
                await db.insert(passwords).values({ userId: user.id, password: credentials.password });
                // **** Transaction class create
                // const tx = new Transaction(db);
                // try {
                //   const [user] = await tx.client.insert(users).values({ email: credentials.email }).returning({ id: users.id, email: users.email, emailVerified: users.emailVerified });
                //   if (!user) {
                //     await tx.rollback();
                //     return [new AuthError({ kind: 'DB USER CREATE FAILED', message: 'User create failed' }), undefined];
                //   }
                //   await tx.client.insert(passwords).values({ userId: user.id, password: credentials.password });
                //   return [null, user];
                // } catch (error) {
                //   await tx.rollback();
                //   return [new AuthError({ kind: 'DB USER CREATE FAILED', message: error?.message }), undefined];
                // }
                // **** Drizzle Transaction
                // await db.transaction(async (tx) => {
                //   [user] = await tx.insert(users).values({ email: credentials.email }).returning({ id: users.id, email: users.email, emailVerified: users.emailVerified });
                //   if (!user) {
                //     tx.rollback();
                //   }
                //   await tx.insert(passwords).values({ userId: user.id, password: credentials.password });
                // });
                // **** D1 Transaction
                // [error, user] = await contextEnv(context).MAIN_D1.transaction(async (tx) => {
                //   [user] = await db.insert(users).values({ email: credentials.email }).returning({ id: users.id, email: users.email, emailVerified: users.emailVerified });
                //   if (!user) {
                //     await tx.rollback();
                //     return [new AuthError({ kind: 'DB USER CREATE FAILED', message: error?.message }), undefined];
                //   }
                //   await db.insert(passwords).values({ userId: user.id, password: credentials.password, verified: true });
                //   await tx.commit();
                //   return [null, user];
                // });
            }
            catch (error) {
                return [new AuthError({ kind: 'DB USER CREATE FAILED', message: error?.message }), undefined];
            }
        }
        return [null, user];
    },
    findOrCreateHashed: async (context, credentials, canExist) => {
        const [error, user] = await authRepository.findOrCreate(context, { email: credentials.email, password: await hashPassword(credentials.password) }, canExist);
        if (error)
            return [error, undefined];
        return [null, user];
    },
    findOneEmail: async (context, email) => {
        const db = context.db;
        try {
            const [user] = await db.select({ id: users.id, email: users.email, emailVerified: users.emailVerified }).from(users).where(eq(users.email, email)).limit(1);
            if (!user) {
                return [new AuthError({ kind: 'DB USER FIND FAILED', message: error?.message }), undefined];
            }
            return [null, user];
        }
        catch (error) {
            return [new AuthError({ kind: 'DB USER FIND FAILED', message: error?.message }), undefined];
        }
    },
    findOneId: async (context, id) => {
        const db = context.db;
        try {
            const [user] = await db.select({ id: users.id, email: users.email, emailVerified: users.emailVerified }).from(users).where(eq(users.id, id)).limit(1);
            return [null, user];
        }
        catch (error) {
            return [new AuthError({ kind: 'DB USER FIND FAILED', message: error?.message }), undefined];
        }
    },
    findOneHashed: async (context, credentials) => {
        const db = context.db;
        let vulnerable;
        try {
            [vulnerable] = await db
                .select({ id: users.id, email: users.email, emailVerified: users.emailVerified, password: passwords.password })
                .from(users)
                .leftJoin(passwords, eq(users.id, passwords.userId))
                .where(eq(users.email, credentials.email))
                .orderBy(desc(passwords.createdAt))
                .limit(1);
        }
        catch (error) {
            return [new AuthError({ kind: 'DB USER FIND FAILED', message: error?.message }), undefined];
        }
        if (!vulnerable || !vulnerable.password)
            return [new AuthError({ kind: 'DB USER FIND FAILED', message: `The provided credentials don't match an active user.` }), undefined];
        const { password, ...user } = vulnerable;
        if (!(await comparePassword(credentials.password, password))) {
            return [new AuthError({ kind: 'DB USER CREDENTIALS', message: `The provided credentials don't match an active user.` }), undefined];
        }
        return [null, user];
    },
    delete: async (context, id) => {
        const db = context.db;
        await db.delete(passwords).where(eq(passwords.userId, id));
        const [result] = await db.delete(users).where(eq(users.id, id)).returning({ deletedId: users.id });
        if (result.deletedId !== id) {
            return [new AuthError({ kind: 'DB USER DELETE FAILED', message: error?.message }), undefined];
        }
        return [null, true];
    },
    updateUserVerified: async (context, email, verified) => {
        const db = context.db;
        try {
            const [user] = await db.update(users).set({ emailVerified: verified }).where(eq(users.email, email)).returning({ id: users.id, email: users.email, emailVerified: users.emailVerified });
            return [null, user];
        }
        catch (error) {
            return [new AuthError({ kind: 'DB USER UPDATE FAILED', message: error?.message }), undefined];
        }
    },
    updateStoredPassword: async (context, email, password) => {
        const db = context.db;
        try {
            const [error, user] = await authRepository.updateUserVerified(context, email, false);
            if (error)
                return [error, user];
            await db.insert(passwords).values({ userId: user.id, password: await hashPassword(password) });
            return [null, user];
        }
        catch (error) {
            return [new AuthError({ kind: 'DB USER PASSWORD UPDATE FAILED', message: error?.message }), undefined];
        }
    },
};
