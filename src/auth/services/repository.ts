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
   * Get user by email
   * Returns User or AppError (including not found error)
   */
  async getUserByEmail(email: string): Promise<Result<User>> {
    return tryCatch(
      async () => {
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
          code: 'DUPLICATE_USER'
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
   * Update authenticator usage (counter and last used timestamp)
   * Returns true if updated, or AppError if failed
   */
  async updateAuthenticatorUsage(id: string, counter: number, lastUsedAt: Date): Promise<Result<boolean>> {
    try {
      const result = await this.db.update(authenticators)
        .set({ 
          counter,
          lastUsedAt
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
      const result = await this.db.update(authenticators)
        .set({ name })
        .where(eq(authenticators.id, id))
        .returning();

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
  async registerUser(email: string, displayName: string): Promise<Result<User>> {
    // Check if email already exists
    const existingUser = await this.repo.getUserByEmail(email);

    // If it's an error and NOT a not-found error, return it
    if (isError(existingUser)) {
      // If it's a not-found error, that's good - we can create the user
      if (existingUser.code !== 'NOT_FOUND') {
        return existingUser; // Pass through other errors
      }
      // Not found is what we want - continue to create user
    } else {
      // User exists - can't create duplicate
      return err('Email already taken', {
        email,
        code: 'USER_EXISTS'
      });
    }

    // Create the user
    return this.repo.createUser(email, displayName);
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

  /**
   * Update authenticator name for user-friendly device management
   */
  async updateAuthenticatorName(userId: string, authenticatorId: string, name: string): Promise<Result<Authenticator>> {
    // First verify the authenticator belongs to the user
    const authenticatorResult = await this.repo.getAuthenticatorById(authenticatorId);
    
    if (isError(authenticatorResult)) {
      return authenticatorResult;
    }

    if (authenticatorResult.userId !== userId) {
      return err('Authenticator not found', { 
        authenticatorId,
        code: 'NOT_FOUND' 
      });
    }

    // Update the name
    return this.repo.updateAuthenticatorName(authenticatorId, name);
  }

  /**
   * Get user authenticators with friendly names and usage info
   */
  async getUserAuthenticatorsWithMetadata(userId: string): Promise<Result<Array<Authenticator & {
    friendlyName: string;
    deviceInfo: string;
  }>>> {
    const authenticatorsResult = await this.repo.getAuthenticatorsByUserId(userId);
    
    if (isError(authenticatorsResult)) {
      return authenticatorsResult;
    }

    // Add friendly metadata to each authenticator
    const enrichedAuthenticators = authenticatorsResult.map(auth => ({
      ...auth,
      friendlyName: auth.name || this.generateFriendlyName(auth),
      deviceInfo: this.generateDeviceInfo(auth),
    }));

    return enrichedAuthenticators;
  }

  /**
   * Generate a friendly name for an authenticator if none is set
   */
  private generateFriendlyName(auth: Authenticator): string {
    // Try to get device info from AAGUID if available
    if (auth.aaguid) {
      try {
        const deviceInfo = this.getDeviceInfoFromAAGUID(auth.aaguid);
        if (deviceInfo.vendor !== 'Unknown') {
          return `${deviceInfo.vendor} ${deviceInfo.model}`;
        }
      } catch {
        // Fall back to generic naming
      }
    }
    
    const deviceType = auth.credentialDeviceType === 'platform' ? 'Device' : 'Security Key';
    const timestamp = auth.createdAt ? new Date(auth.createdAt).toLocaleDateString() : '';
    return `${deviceType}${timestamp ? ` (${timestamp})` : ''}`;
  }

  /**
   * Extract device information from AAGUID for display purposes
   */
  private getDeviceInfoFromAAGUID(aaguidBase64: string): { vendor: string; model: string; certified: boolean } {
    try {
      // Decode base64url AAGUID
      const aaguidBytes = new Uint8Array(
        atob(aaguidBase64.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(char => char.charCodeAt(0))
      );
      
      // Convert to UUID string for lookup
      const aaguidString = Array.from(aaguidBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const uuid = [
        aaguidString.slice(0, 8),
        aaguidString.slice(8, 12),
        aaguidString.slice(12, 16),
        aaguidString.slice(16, 20),
        aaguidString.slice(20, 32)
      ].join('-');
      
      // Simple device lookup (subset of the comprehensive list in webauthn.ts)
      const knownDevices = new Map([
        ['f8a011f3-8c0a-4d15-8006-17111f9edc7d', { vendor: 'Yubico', model: 'YubiKey 5', certified: true }],
        ['08987058-cadc-4b81-b6e1-30de50dcbe96', { vendor: 'Microsoft', model: 'Windows Hello', certified: true }],
        ['143c99b9-841c-4a4e-b0c9-b5ec1e8f7e0a', { vendor: 'Apple', model: 'Touch ID', certified: true }],
        ['0bb43545-fd2c-4185-87dd-feb0b2916ace', { vendor: 'Google', model: 'Titan Key', certified: true }],
      ]);
      
      return knownDevices.get(uuid) || { vendor: 'Unknown', model: 'Device', certified: false };
    } catch {
      return { vendor: 'Unknown', model: 'Device', certified: false };
    }
  }

  /**
   * Generate device information string
   */
  private generateDeviceInfo(auth: Authenticator): string {
    const parts = [];
    
    if (auth.credentialDeviceType) {
      parts.push(auth.credentialDeviceType === 'platform' ? 'Built-in' : 'External');
    }
    
    if (auth.credentialBackedUp) {
      parts.push('Backed up');
    }
    
    if (auth.lastUsedAt) {
      const lastUsed = new Date(auth.lastUsedAt).toLocaleDateString();
      parts.push(`Last used: ${lastUsed}`);
    }
    
    return parts.join(' • ');
  }
}
