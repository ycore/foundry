import { createdAt, cuid, timestamp, updatedAt } from '@ycore/forge/utils';
import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique, uniqueIndex } from 'drizzle-orm/sqlite-core';
// users
export const users = sqliteTable(
  'users',
  {
    id: integer().primaryKey(),
    cuid: cuid(),
    username: text('username').notNull(),
    displayName: text('display_name'),
    email: text('email').notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    status: text('status', { enum: ['active', 'deleted', 'blocked'] })
      .default('active')
      .notNull(),
    createdAt,
    updatedAt,
  },
  t => [uniqueIndex('users_username_unq_idx').on(t.username), uniqueIndex('users_email_unq_idx').on(t.email)]
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// accounts
export const accounts = sqliteTable(
  'accounts',
  {
    id: integer().primaryKey(),
    cuid: cuid(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    provider: text('provider', { enum: ['github', 'google', 'totp'] }).notNull(),
    scopes: text('scopes'),
    idToken: text('id_token'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    createdAt,
    updatedAt,
  },
  t => [index('accounts_user_id_idx').on(t.userId), unique('accounts_provider_account_unq').on(t.provider, t.providerAccountId)]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
