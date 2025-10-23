import { createdAt, cuid, updatedAt } from '@ycore/forge/utils';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Pending data types stored in users.pending field
 */
export type PendingEmailChange = {
  type: 'email-change';
  email: string;
  timestamp: number;
};

export type PendingRecovery = {
  type: 'recovery';
  timestamp: number;
};

export type PendingAccountDelete = {
  type: 'account-delete';
  timestamp: number;
};

export type PendingData = PendingEmailChange | PendingRecovery | PendingAccountDelete;

/**
 * User account status values
 */
export type UserStatus = 'active' | 'unverified' | 'unrecovered' | 'deleted';

export const users = sqliteTable('users', {
  id: cuid('id').primaryKey().notNull(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  status: text('status', { enum: ['active', 'unverified', 'unrecovered', 'deleted'] as const })
    .notNull()
    .default('unverified')
    .$type<UserStatus>(),
  pending: text('pending', { mode: 'json' }).$type<PendingData | null>(),
  createdAt,
  updatedAt,
});

export const authenticators = sqliteTable('authenticators', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialPublicKey: text('credential_public_key').notNull(),
  counter: integer('counter').notNull(),
  credentialDeviceType: text('credential_device_type').notNull(),
  credentialBackedUp: integer('credential_backed_up', { mode: 'boolean' }).notNull(),
  transports: text('transports', { mode: 'json' }).notNull().$type<string[]>(),
  aaguid: text('aaguid').notNull(),
  name: text('name'),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  attestationType: text('attestation_type').notNull().default('none'),
  rpId: text('rp_id').notNull(),
  algorithm: integer('algorithm').notNull(),
  createdAt,
  updatedAt,
});
