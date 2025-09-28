import { createdAt, cuid, updatedAt } from '@ycore/forge/utils';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: cuid('id').primaryKey().notNull(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
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
  transports: text('transports').notNull(),
  aaguid: text('aaguid').notNull(),
  createdAt,
  updatedAt,
});
