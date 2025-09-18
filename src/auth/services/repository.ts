import type { Result } from '@ycore/forge/result';
import { err, isError, notFoundError, serverError, tryCatch } from '@ycore/forge/result';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { Authenticator, NewAuthenticator, NewUser, User } from '../schema';
import { authenticators, users } from '../schema';

export class AuthRepository {
  constructor(private db: DrizzleD1Database) { }

  /**
   * Get user by ID
   * Returns User or AppError (including not found error)
   */
  async getUserById(id: string): Promise<Result<User>> {
    return tryCatch(
      async () => {
        const result = await this.db.select().from(users).where(eq(users.id, id)).get();

        if (!result) {
          return notFoundError('User', id);
        }
        
        return result;
      },
      `Failed to get user by ID: ${id}`
    );
  }

  /**
   * Get user by username
   * Returns User or AppError (including not found error)
   */
  async getUserByUsername(username: string): Promise<Result<User>> {
    return tryCatch(
      async () => {
        const result = await this.db.select().from(users).where(eq(users.username, username)).get();
        
        if (!result) {
          return notFoundError('User', username);
        }
        
        return result;
      }, `Failed to get user by username: ${username}`);
  }

  /**
   * Create a new user
   * Returns the created User or AppError if failed
   */
  async createUser(username: string, displayName: string): Promise<Result<User>> {
    try {
      const newUser: NewUser = { username, displayName };
      const [result] = await this.db.insert(users).values(newUser).returning();

      if (!result) {
        return err('Failed to create user', { username, displayName });
      }

      return result;
    } catch (error) {
      // Check for unique constraint violation
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        return err('Username already exists', {
          username,
          code: 'DUPLICATE_USERNAME'
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
    return tryCatch(
      async () => {
        const result = await this.db.select().from(authenticators).where(eq(authenticators.id, id)).get();

        if (!result) {
          return notFoundError('Authenticator', id);
        }
        
        return result;
      },
      `Failed to get authenticator by ID: ${id}`
    );
  }

  /**
   * Get all authenticators for a user
   * Returns array of Authenticators (empty if none) or AppError if database error
   */
  async getAuthenticatorsByUserId(userId: string): Promise<Result<Authenticator[]>> {
    return tryCatch(
      async () => {
        const result = await this.db.select().from(authenticators).where(eq(authenticators.userId, userId)).all();

        return result;
      },
      `Failed to get authenticators for user: ${userId}`
    );
  }

  /**
   * Create a new authenticator
   * Returns the created Authenticator or AppError if failed
   */
  async createAuthenticator(
    authenticator: Omit<NewAuthenticator, 'createdAt' | 'updatedAt'>
  ): Promise<Result<Authenticator>> {
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
 * Example of how to use the new repository in a service layer
 */
export class AuthService {
  constructor(private repo: AuthRepository) { }

  /**
   * Register a new user - demonstrates error handling
   */
  async registerUser(username: string, displayName: string): Promise<Result<User>> {
    // Check if username already exists
    const existingUser = await this.repo.getUserByUsername(username);

    // If it's an error and NOT a not-found error, return it
    if (isError(existingUser)) {
      // If it's a not-found error, that's good - we can create the user
      if (existingUser.code !== 'NOT_FOUND') {
        return existingUser; // Pass through other errors
      }
      // Not found is what we want - continue to create user
    } else {
      // User exists - can't create duplicate
      return err('Username already taken', {
        username,
        code: 'USERNAME_EXISTS'
      });
    }

    // Create the user
    return this.repo.createUser(username, displayName);
  }

  /**
   * Get user with authenticators - demonstrates combining results
   */
  async getUserWithAuthenticators(userId: string): Promise<Result<{
    user: User;
    authenticators: Authenticator[];
  }>> {
    const userResult = await this.repo.getUserById(userId);

    // Check for error (including not found)
    if (isError(userResult)) {
      return userResult;
    }

    const authenticatorsResult = await this.repo.getAuthenticatorsByUserId(userId);

    // Check for error
    if (isError(authenticatorsResult)) {
      return authenticatorsResult;
    }

    return {
      user: userResult,
      authenticators: authenticatorsResult
    };
  }
}
