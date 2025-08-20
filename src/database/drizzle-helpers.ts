import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';

export const cuid = (name: string) =>
  text(name)
    .notNull()
    .unique()
    .$defaultFn(() => createId());
// .$defaultFn(() => crypto.randomUUID());

export const timestamp = (name: string) => integer(name, { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`);
export const createdAt = timestamp('created_at');
export const updatedAt = timestamp('updated_at');
