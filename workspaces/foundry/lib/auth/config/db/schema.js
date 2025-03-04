import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
const uuid = (name) => text(name)
    .unique()
    .notNull()
    .$defaultFn(() => crypto.randomUUID());
export const users = sqliteTable('users', {
    id: integer().primaryKey(),
    uuid: uuid('uuid'),
    email: text().notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' })
        .notNull()
        .default(sql `false`),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql `(unixepoch())`),
}, 
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
(_t) => []);
export const passwords = sqliteTable('passwords', {
    id: integer().primaryKey(),
    userId: integer('user_id').references(() => users.id),
    password: text().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql `(unixepoch())`),
}, (t) => [index('created_idx').on(t.userId, t.createdAt)]);
// {
//   return {
//     createdIndex: index('created_idx').on(t.userId, t.createdAt),
//   };
// }
//# sourceMappingURL=schema.js.map