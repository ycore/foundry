import type { AppResult } from '@ycore/forge/result';
import { returnFailure, returnSuccess } from '@ycore/forge/result';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { nanoid } from 'nanoid';
import type { Authenticator, NewAuthenticator, NewUser, User } from '../schema';
import { authenticators, users } from '../schema';

export class AuthRepository {
  constructor(private db: DrizzleD1Database) { }

  async getUserById(id: string): Promise<AppResult<User | null>> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id)).get();
      return returnSuccess(result || null);
    } catch (error) {
      return returnFailure({ message: 'Failed to get user by ID' });
    }
  }

  async getUserByUsername(username: string): Promise<AppResult<User | null>> {
    try {
      const result = await this.db.select().from(users).where(eq(users.username, username)).get();
      return returnSuccess(result || null);
    } catch (error) {
      return returnFailure({ message: 'Failed to get user by username' });
    }
  }

  async createUser(username: string, displayName: string): Promise<AppResult<User>> {
    try {
      const userId = nanoid(); // Generate nanoid as string
      const newUser: NewUser = {
        id: userId,
        username,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.insert(users).values(newUser);
      const result = await this.db.select().from(users).where(eq(users.id, newUser.id)).get();

      if (!result) {
        return returnFailure({ message: 'Failed to create user' });
      }

      return returnSuccess(result);
    } catch (error) {
      return returnFailure({ message: 'Failed to create user' });
    }
  }

  async getAuthenticatorById(id: string): Promise<AppResult<Authenticator | null>> {
    try {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.id, id)).get();
      return returnSuccess(result || null);
    } catch (error) {
      return returnFailure({ message: 'Failed to get authenticator' });
    }
  }

  async getAuthenticatorsByUserId(userId: string): Promise<AppResult<Authenticator[]>> {
    try {
      const result = await this.db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();
      return returnSuccess(result);
    } catch (error) {
      return returnFailure({ message: 'Failed to get authenticators' });
    }
  }

  async createAuthenticator(authenticator: Omit<NewAuthenticator, 'createdAt' | 'updatedAt'>): Promise<AppResult<Authenticator>> {
    try {
      const newAuthenticator: NewAuthenticator = {
        ...authenticator,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.insert(authenticators).values(newAuthenticator);
      const result = await this.db.select().from(authenticators).where(eq(authenticators.id, newAuthenticator.id)).get();

      if (!result) {
        return returnFailure({ message: 'Failed to create authenticator' });
      }

      return returnSuccess(result);
    } catch (error) {
      return returnFailure({ message: 'Failed to create authenticator' });
    }
  }

  async updateAuthenticatorCounter(id: string, counter: number): Promise<AppResult<boolean>> {
    try {
      await this.db.update(authenticators).set({ counter, updatedAt: new Date() }).where(eq(authenticators.id, id));
      return returnSuccess(true);
    } catch (error) {
      return returnFailure({ message: 'Failed to update authenticator counter' });
    }
  }
}
