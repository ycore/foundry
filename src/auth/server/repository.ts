import type { Result } from '@ycore/forge/result';
import { err, notFoundError, serverError, tryCatch } from '@ycore/forge/result';
import { getDatabase } from '@ycore/forge/services';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { RouterContextProvider } from 'react-router';
import type { Authenticator, NewAuthenticator, NewUser, User } from '../schema';
import { authenticators, users } from '../schema';

export class AuthRepository {
  constructor(private db: DrizzleD1Database<Record<string, unknown>>) { }

  /**
   * Get user by ID
   * Returns User or AppError (including not found error)
   */
  async getUserById(id: string): Promise<Result<User>> {
    return tryCatch(async () => {
      const result = await this.db.select().from(users).where(eq(users.id, id)).get();

      if (!result) {
        return notFoundError('User', id);
      }

      return result;
    }, `Failed to get user by ID: ${id}`);
  }

  /**
   * Get user by email
   * Returns User or AppError (including not found error)
   */
  async getUserByEmail(email: string): Promise<Result<User>> {
    return tryCatch(async () => {
      const result = await this.db.select().from(users).where(eq(users.email, email)).get();

      if (!result) {
        return notFoundError('User', email);
      }

      return result;
    }, `Failed to get user by email: ${email}`);
  }

  /**
   * Create a new user
   * Returns the created User or AppError if failed
   */
  async createUser(email: string, displayName: string): Promise<Result<User>> {
    try {
      const newUser: NewUser = { email, displayName };
      const [result] = await this.db.insert(users).values(newUser).returning();

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
  }

  /**
   * Get authenticator by ID
   * Returns Authenticator or AppError (including not found error)
   */
  async getAuthenticatorById(id: string): Promise<Result<Authenticator>> {
    return tryCatch(async () => {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.id, id)).get();

      if (!result) {
        return notFoundError('Authenticator', id);
      }

      return result;
    }, `Failed to get authenticator by ID: ${id}`);
  }

  /**
   * Get all authenticators for a user
   * Returns array of Authenticators (empty if none) or AppError if database error
   */
  async getAuthenticatorsByUserId(userId: string): Promise<Result<Authenticator[]>> {
    return tryCatch(async () => {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();

      return result;
    }, `Failed to get authenticators for user: ${userId}`);
  }

  /**
   * Create a new authenticator
   * Returns the created Authenticator or AppError if failed
   */
  async createAuthenticator(authenticator: Omit<NewAuthenticator, 'createdAt' | 'updatedAt'>): Promise<Result<Authenticator>> {
    try {
      const [result] = await this.db.insert(authenticators).values(authenticator).returning();

      if (!result) {
        return err('Failed to create authenticator', { id: authenticator.id });
      }

      return result;
    } catch (error) {
      return serverError('Failed to create authenticator', error as Error);
    }
  }

  /**
   * Update authenticator counter
   * Returns true if updated, or AppError if failed
   */
  async updateAuthenticatorCounter(id: string, counter: number): Promise<Result<boolean>> {
    try {
      const result = await this.db.update(authenticators).set({ counter }).where(eq(authenticators.id, id)).returning();

      if (result.length === 0) {
        return notFoundError('Authenticator', id);
      }

      return true;
    } catch (error) {
      return serverError('Failed to update authenticator counter', error as Error);
    }
  }

  /**
   * Update authenticator usage (counter and last used timestamp)
   * Returns true if updated, or AppError if failed
   */
  async updateAuthenticatorUsage(id: string, counter: number, lastUsedAt: Date): Promise<Result<boolean>> {
    try {
      const result = await this.db
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
  }

  /**
   * Update authenticator name
   * Returns updated authenticator or AppError if failed
   */
  async updateAuthenticatorName(id: string, name: string): Promise<Result<Authenticator>> {
    try {
      const result = await this.db.update(authenticators).set({ name }).where(eq(authenticators.id, id)).returning();

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
  }

  /**
   * Delete an authenticator
   * Returns true if deleted, or AppError if failed
   */
  async deleteAuthenticator(id: string): Promise<Result<boolean>> {
    try {
      const result = await this.db.delete(authenticators).where(eq(authenticators.id, id)).returning();

      if (result.length === 0) {
        return notFoundError('Authenticator', id);
      }

      return true;
    } catch (error) {
      return serverError('Failed to delete authenticator', error as Error);
    }
  }

  /**
   * Check if an authenticator belongs to a specific user
   * Returns true if authenticator exists and belongs to user, false otherwise
   */
  async authenticatorBelongsToUser(id: string, userId: string): Promise<Result<boolean>> {
    return tryCatch(async () => {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.id, id)).get();

      if (!result) {
        return false;
      }

      return result.userId === userId;
    }, `Failed to verify authenticator ownership for ID: ${id}`);
  }

  /**
   * Count authenticators for a user
   * Returns count or AppError if database error
   */
  async countAuthenticatorsByUserId(userId: string): Promise<Result<number>> {
    return tryCatch(async () => {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();

      return result.length;
    }, `Failed to count authenticators for user: ${userId}`);
  }

  /**
   * Update user email
   * Returns updated User or AppError if failed
   */
  async updateUserEmail(id: string, newEmail: string): Promise<Result<User>> {
    try {
      const result = await this.db
        .update(users)
        .set({ email: newEmail, emailVerified: false })
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
      // Check for unique constraint violation
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        return err('Email already exists', {
          email: newEmail,
          code: 'DUPLICATE_EMAIL',
        });
      }

      return serverError('Failed to update user email', error as Error);
    }
  }

  /**
   * Update user email verified status
   * Returns updated User or AppError if failed
   */
  async updateEmailVerified(id: string, verified: boolean): Promise<Result<User>> {
    try {
      const result = await this.db
        .update(users)
        .set({ emailVerified: verified })
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
      return serverError('Failed to update email verified status', error as Error);
    }
  }

  /**
   * Delete a user and all their authenticators
   * Returns true if deleted, or AppError if failed
   */
  async deleteUser(id: string): Promise<Result<boolean>> {
    try {
      // Use a transaction to ensure consistency
      const deleteAuthenticatorsResult = await this.db.delete(authenticators).where(eq(authenticators.userId, id));

      const deleteUserResult = await this.db.delete(users).where(eq(users.id, id)).returning();

      if (deleteUserResult.length === 0) {
        return notFoundError('User', id);
      }

      return true;
    } catch (error) {
      return serverError('Failed to delete user', error as Error);
    }
  }
}

/**
 * Get authentication repository instance
 */
export function getAuthRepository(context: Readonly<RouterContextProvider>) {
  const db = getDatabase(context);
  return new AuthRepository(db);
}
