import type { Result } from '@ycore/forge/result';
import { err, notFoundError, serverError, tryCatch } from '@ycore/forge/result';
import { getDatabase } from '@ycore/forge/services';
import { and, eq, lt } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { RouterContextProvider } from 'react-router';
import type { Authenticator, NewAuthenticator, NewUser, PendingData, User, UserStatus } from '../schema';
import { authenticators, users } from '../schema';

export interface AuthRepository {
  getUserById: (id: string) => Promise<Result<User>>;
  getUserByEmail: (email: string) => Promise<Result<User>>;
  createUser: (email: string, displayName: string) => Promise<Result<User>>;
  getAuthenticatorById: (id: string) => Promise<Result<Authenticator>>;
  getAuthenticatorsByUserId: (userId: string) => Promise<Result<Authenticator[]>>;
  createAuthenticator: (authenticator: Omit<NewAuthenticator, 'createdAt' | 'updatedAt'>) => Promise<Result<Authenticator>>;
  updateAuthenticatorCounter: (id: string, counter: number) => Promise<Result<boolean>>;
  updateAuthenticatorUsage: (id: string, counter: number, lastUsedAt: Date) => Promise<Result<boolean>>;
  updateAuthenticatorName: (id: string, name: string) => Promise<Result<Authenticator>>;
  deleteAuthenticator: (id: string) => Promise<Result<boolean>>;
  authenticatorBelongsToUser: (id: string, userId: string) => Promise<Result<boolean>>;
  countAuthenticatorsByUserId: (userId: string) => Promise<Result<number>>;
  deleteAuthenticatorsByTimestamp: (userId: string, beforeTimestamp: number) => Promise<Result<number>>;
  updateUserEmail: (id: string, newEmail: string) => Promise<Result<User>>;
  updateUserStatus: (id: string, status: UserStatus) => Promise<Result<User>>;
  updateUserPending: (id: string, pending: PendingData | null) => Promise<Result<User>>;
  deleteUser: (id: string) => Promise<Result<boolean>>;
}

/**
 * Create authentication repository instance with database operations
 */
export function createAuthRepository(db: DrizzleD1Database<Record<string, unknown>>): AuthRepository {
  return {
    /** Get user by ID */
    getUserById: async (id: string) => {
      return tryCatch(async () => {
        const result = await db.select().from(users).where(eq(users.id, id)).get();

        if (!result) {
          return notFoundError('User', id);
        }

        return result;
      }, `Failed to get user by ID: ${id}`);
    },

    /** Get user by email */
    getUserByEmail: async (email: string) => {
      return tryCatch(async () => {
        const result = await db.select().from(users).where(eq(users.email, email)).get();

        if (!result) {
          return notFoundError('User', email);
        }

        return result;
      }, `Failed to get user by email: ${email}`);
    },

    /** Create a new user */
    createUser: async (email: string, displayName: string) => {
      try {
        const newUser: NewUser = { email, displayName };
        const [result] = await db.insert(users).values(newUser).returning();

        if (!result) {
          return err('Failed to create user', { email, displayName });
        }

        return result;
      } catch (error) {
        // Check for unique constraint violation
        if (error instanceof Error && error.message.includes('UNIQUE')) {
          return err('Email already exists', {
            email,
            code: 'DUPLICATE_USER',
          });
        }

        return serverError('Failed to create user', error as Error);
      }
    },

    /** Get authenticator by ID */
    getAuthenticatorById: async (id: string) => {
      return tryCatch(async () => {
        const result = await db.select().from(authenticators).where(eq(authenticators.id, id)).get();

        if (!result) {
          return notFoundError('Authenticator', id);
        }

        return result;
      }, `Failed to get authenticator by ID: ${id}`);
    },

    /** Get all authenticators for a user */
    getAuthenticatorsByUserId: async (userId: string) => {
      return tryCatch(async () => {
        const result = await db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();

        return result;
      }, `Failed to get authenticators for user: ${userId}`);
    },

    /** Create a new authenticator */
    createAuthenticator: async (authenticator: Omit<NewAuthenticator, 'createdAt' | 'updatedAt'>) => {
      try {
        const [result] = await db.insert(authenticators).values(authenticator).returning();

        if (!result) {
          return err('Failed to create authenticator', { id: authenticator.id });
        }

        return result;
      } catch (error) {
        return serverError('Failed to create authenticator', error as Error);
      }
    },

    /** Update authenticator counter */
    updateAuthenticatorCounter: async (id: string, counter: number) => {
      try {
        const result = await db.update(authenticators).set({ counter }).where(eq(authenticators.id, id)).returning();

        if (result.length === 0) {
          return notFoundError('Authenticator', id);
        }

        return true;
      } catch (error) {
        return serverError('Failed to update authenticator counter', error as Error);
      }
    },

    /** Update authenticator usage (counter and last used timestamp) */
    updateAuthenticatorUsage: async (id: string, counter: number, lastUsedAt: Date) => {
      try {
        const result = await db
          .update(authenticators)
          .set({
            counter,
            lastUsedAt,
          })
          .where(eq(authenticators.id, id))
          .returning();

        if (result.length === 0) {
          return notFoundError('Authenticator', id);
        }

        return true;
      } catch (error) {
        return serverError('Failed to update authenticator usage', error as Error);
      }
    },

    /** Update authenticator name */
    updateAuthenticatorName: async (id: string, name: string) => {
      try {
        const result = await db.update(authenticators).set({ name }).where(eq(authenticators.id, id)).returning();

        if (result.length === 0) {
          return notFoundError('Authenticator', id);
        }

        const updatedAuthenticator = result[0];
        if (!updatedAuthenticator) {
          return serverError('Failed to retrieve updated authenticator', new Error('Update returned empty result'));
        }

        return updatedAuthenticator;
      } catch (error) {
        return serverError('Failed to update authenticator name', error as Error);
      }
    },

    /** Delete an authenticator */
    deleteAuthenticator: async (id: string) => {
      try {
        const result = await db.delete(authenticators).where(eq(authenticators.id, id)).returning();

        if (result.length === 0) {
          return notFoundError('Authenticator', id);
        }

        return true;
      } catch (error) {
        return serverError('Failed to delete authenticator', error as Error);
      }
    },

    /** Check if an authenticator belongs to a specific user */
    authenticatorBelongsToUser: async (id: string, userId: string) => {
      return tryCatch(async () => {
        const result = await db.select().from(authenticators).where(eq(authenticators.id, id)).get();

        if (!result) {
          return false;
        }

        return result.userId === userId;
      }, `Failed to verify authenticator ownership for ID: ${id}`);
    },

    /** Count authenticators for a user */
    countAuthenticatorsByUserId: async (userId: string) => {
      return tryCatch(async () => {
        const result = await db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();

        return result.length;
      }, `Failed to count authenticators for user: ${userId}`);
    },

    /** Update user email and set status to unverified */
    updateUserEmail: async (id: string, newEmail: string) => {
      try {
        const result = await db.update(users).set({ email: newEmail, status: 'unverified' }).where(eq(users.id, id)).returning();

        if (result.length === 0) {
          return notFoundError('User', id);
        }

        const updatedUser = result[0];
        if (!updatedUser) {
          return serverError('Failed to retrieve updated user', new Error('Update returned empty result'));
        }

        return updatedUser;
      } catch (error) {
        // Check for unique constraint violation
        if (error instanceof Error && error.message.includes('UNIQUE')) {
          return err('Email already exists', {
            email: newEmail,
            code: 'DUPLICATE_EMAIL',
          });
        }

        return serverError('Failed to update user email', error as Error);
      }
    },

    /** Update user status */
    updateUserStatus: async (id: string, status: UserStatus) => {
      try {
        const result = await db.update(users).set({ status }).where(eq(users.id, id)).returning();

        if (result.length === 0) {
          return notFoundError('User', id);
        }

        const updatedUser = result[0];
        if (!updatedUser) {
          return serverError('Failed to retrieve updated user', new Error('Update returned empty result'));
        }

        return updatedUser;
      } catch (error) {
        return serverError('Failed to update user status', error as Error);
      }
    },

    /** Update user pending data */
    updateUserPending: async (id: string, pending: PendingData | null) => {
      try {
        const result = await db
          .update(users)
          .set({ pending })
          .where(eq(users.id, id))
          .returning();

        if (result.length === 0) {
          return notFoundError('User', id);
        }

        const updatedUser = result[0];
        if (!updatedUser) {
          return serverError('Failed to retrieve updated user', new Error('Update returned empty result'));
        }

        return updatedUser;
      } catch (error) {
        return serverError('Failed to update user pending data', error as Error);
      }
    },

    /** Delete all authenticators created before a specific timestamp */
    deleteAuthenticatorsByTimestamp: async (userId: string, beforeTimestamp: number) => {
      try {
        // Convert timestamp to Date for comparison
        const beforeDate = new Date(beforeTimestamp);

        const result = await db
          .delete(authenticators)
          .where(and(eq(authenticators.userId, userId), lt(authenticators.updatedAt, beforeDate)))
          .returning();

        return result.length;
      } catch (error) {
        return serverError('Failed to delete authenticators by timestamp', error as Error);
      }
    },

    /** Delete a user and all their authenticators */
    deleteUser: async (id: string) => {
      try {
        // Use a transaction to ensure consistency
        const _deleteAuthenticatorsResult = await db.delete(authenticators).where(eq(authenticators.userId, id));
        const deleteUserResult = await db.delete(users).where(eq(users.id, id)).returning();

        if (deleteUserResult.length === 0) {
          return notFoundError('User', id);
        }

        return true;
      } catch (error) {
        return serverError('Failed to delete user', error as Error);
      }
    },
  };
}

/**
 * Get authentication repository instance from context
 */
export function getAuthRepository(context: Readonly<RouterContextProvider>): AuthRepository {
  const db = getDatabase(context);
  return createAuthRepository(db);
}
