import type { AppResult } from '@ycore/forge/result';
import { createAppError, returnFailure, returnSuccess, toAppError } from '@ycore/forge/result';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { Authenticator, NewAuthenticator, NewUser, User } from '../schema';
import { authenticators, users } from '../schema';

export class AuthRepository {
  constructor(private db: DrizzleD1Database) { }

  async getUserById(id: string): Promise<AppResult<User | null>> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id)).get();
      return returnSuccess(result || null);
    } catch (error) {
      return returnFailure(createAppError('Failed to get user by ID', { id, error: toAppError(error) }));
    }
  }

  async getUserByUsername(username: string): Promise<AppResult<User | null>> {
    try {
      const result = await this.db.select().from(users).where(eq(users.username, username)).get();
      return returnSuccess(result || null);
    } catch (error) {
      return returnFailure(createAppError('Failed to get user by username', { username, error: toAppError(error) }));
    }
  }

  async createUser(username: string, displayName: string): Promise<AppResult<User>> {
    try {
      const newUser: NewUser = { username, displayName };

      const [result] = await this.db.insert(users).values(newUser).returning();

      if (!result) {
        return returnFailure(createAppError('Failed to create user', { username }));
      }

      return returnSuccess(result);
    } catch (error) {
      return returnFailure(createAppError('Failed to create user', { username, error: toAppError(error) }));
    }
  }

  async getAuthenticatorById(id: string): Promise<AppResult<Authenticator | null>> {
    try {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.id, id)).get();
      return returnSuccess(result || null);
    } catch (error) {
      return returnFailure(createAppError('Failed to get authenticator', { id, error: toAppError(error) }));
    }
  }

  async getAuthenticatorsByUserId(userId: string): Promise<AppResult<Authenticator[]>> {
    try {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();
      return returnSuccess(result);
    } catch (error) {
      return returnFailure(createAppError('Failed to get authenticators', { userId, error: toAppError(error) }));
    }
  }

  async createAuthenticator(authenticator: Omit<NewAuthenticator, 'createdAt' | 'updatedAt'>): Promise<AppResult<Authenticator>> {
    try {
      const [result] = await this.db.insert(authenticators).values(authenticator).returning();

      if (!result) {
        return returnFailure(createAppError('Failed to create authenticator', { id: authenticator.id }));
      }

      return returnSuccess(result);
    } catch (error) {
      return returnFailure(createAppError('Failed to create authenticator', { id: authenticator.id, error: toAppError(error) }));
    }
  }

  async updateAuthenticatorCounter(id: string, counter: number): Promise<AppResult<boolean>> {
    try {
      await this.db.update(authenticators).set({ counter }).where(eq(authenticators.id, id));
      return returnSuccess(true);
    } catch (error) {
      return returnFailure(createAppError('Failed to update authenticator counter', { id, counter, error: toAppError(error) }));
    }
  }
}
