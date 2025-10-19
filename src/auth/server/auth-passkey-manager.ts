import { getContext } from '@ycore/forge/context';
import { logger } from '@ycore/forge/logger';
import { err, isError, ok, type Result } from '@ycore/forge/result';
import { getKVStore } from '@ycore/forge/services';
import { authConfigContext } from '@ycore/foundry/auth';
import type { RouterContextProvider } from 'react-router';

import type { WebAuthnRegistrationData } from '../@types/auth.types';
import type { Authenticator } from '../schema';
import { getAuthRepository } from './repository';
import { getAuthSession } from './session';
import { createRegistrationOptions, generateChallenge, verifyRegistration } from './webauthn';
import { resolveRpId } from './webauthn-config';

const MAX_AUTHENTICATORS_PER_USER = 10;
const MIN_AUTHENTICATORS_PER_USER = 1;

/**
 * Add a new passkey for an existing authenticated user
 *
 * @param context - Router context provider
 * @param userId - User ID to associate the passkey with
 * @param credential - WebAuthn registration credential data
 * @param challenge - The challenge used for registration
 * @param origin - The validated origin (should come from validateWebAuthnOrigin)
 * @param request - Request object for rpId resolution
 */
export async function addPasskeyForUser(context: Readonly<RouterContextProvider>, userId: string, credential: WebAuthnRegistrationData, challenge: string, origin: string, request: Request): Promise<Result<Authenticator>> {
  const repo = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);

  if (!authConfig) {
    return err('Auth configuration not found', { field: 'general' });
  }

  // Resolve rpId from context/request (always use resolveRpId for consistency)
  const rpId = resolveRpId(context, request);

  // Get metadata KV from config (follows CSRF pattern)
  const metadataKV = authConfig.webauthn.kvBinding ? getKVStore(context, authConfig.webauthn.kvBinding) : undefined;

  // Check current authenticator count
  const countResult = await repo.countAuthenticatorsByUserId(userId);
  if (isError(countResult)) {
    return countResult;
  }

  if (countResult >= MAX_AUTHENTICATORS_PER_USER) {
    logger.warning('passkey_add_max_reached', { userId, count: countResult });
    return err('Maximum number of authenticators reached', {
      limit: `You can have a maximum of ${MAX_AUTHENTICATORS_PER_USER} authenticators`,
    });
  }

  // Verify the registration
  const verificationResult = await verifyRegistration(credential, challenge, origin, rpId, metadataKV);

  if (isError(verificationResult)) {
    logger.error('passkey_add_verification_failed', { userId, error: verificationResult });
    return verificationResult;
  }

  // Create the new authenticator
  const createResult = await repo.createAuthenticator({ ...verificationResult, userId });

  if (isError(createResult)) {
    logger.error('passkey_add_create_failed', { userId, error: createResult });
    return createResult;
  }

  return ok(createResult);
}

/**
 * Rename an existing passkey
 */
export async function renamePasskey(context: Readonly<RouterContextProvider>, userId: string, authenticatorId: string, newName: string): Promise<Result<Authenticator>> {
  const repo = getAuthRepository(context);

  // Verify ownership
  const ownershipResult = await repo.authenticatorBelongsToUser(authenticatorId, userId);
  if (isError(ownershipResult)) {
    logger.error('passkey_rename_ownership_check_failed', { userId, authenticatorId, error: ownershipResult });
    return ownershipResult;
  }

  if (!ownershipResult) {
    logger.warning('passkey_rename_unauthorized', { userId, authenticatorId });
    return err('Authenticator not found or unauthorized', {
      authenticator: 'You do not have permission to modify this authenticator',
    });
  }

  // Validate name
  const trimmedName = newName.trim();
  if (trimmedName.length < 1 || trimmedName.length > 50) {
    return err('Invalid authenticator name', {
      name: 'Name must be between 1 and 50 characters',
    });
  }

  // Update the name
  const updateResult = await repo.updateAuthenticatorName(authenticatorId, trimmedName);
  if (isError(updateResult)) {
    logger.error('passkey_rename_failed', { userId, authenticatorId, error: updateResult });
    return updateResult;
  }

  return ok(updateResult);
}

/**
 * Delete a passkey (with minimum authenticator enforcement)
 */
export async function deletePasskey(context: Readonly<RouterContextProvider>, userId: string, authenticatorId: string): Promise<Result<boolean>> {
  const repo = getAuthRepository(context);

  // Verify ownership
  const ownershipResult = await repo.authenticatorBelongsToUser(authenticatorId, userId);
  if (isError(ownershipResult)) {
    logger.error('passkey_delete_ownership_check_failed', { userId, authenticatorId, error: ownershipResult });
    return ownershipResult;
  }

  if (!ownershipResult) {
    logger.warning('passkey_delete_unauthorized', { userId, authenticatorId });
    return err('Authenticator not found or unauthorized', {
      authenticator: 'You do not have permission to delete this authenticator',
    });
  }

  // Check if user would have minimum authenticators after deletion
  const countResult = await repo.countAuthenticatorsByUserId(userId);
  if (isError(countResult)) {
    logger.error('passkey_delete_count_failed', { userId, error: countResult });
    return countResult;
  }

  if (countResult <= MIN_AUTHENTICATORS_PER_USER) {
    logger.warning('passkey_delete_minimum_required', { userId, count: countResult });
    return err('Cannot delete last authenticator', {
      authenticator: 'You must have at least one authenticator for security',
    });
  }

  // Delete the authenticator
  const deleteResult = await repo.deleteAuthenticator(authenticatorId);
  if (isError(deleteResult)) {
    logger.error('passkey_delete_failed', { userId, authenticatorId, error: deleteResult });
    return deleteResult;
  }

  return ok(true);
}

/**
 * Generate registration options for adding a new passkey
 */
export async function generateAddPasskeyOptions(
  context: Readonly<RouterContextProvider>,
  request: Request,
  userId: string,
  rpName: string,
  rpId: string
): Promise<Result<{ challenge: string; options: PublicKeyCredentialCreationOptions }>> {
  const repo = getAuthRepository(context);
  const authSession = await getAuthSession(request, context);

  if (isError(authSession)) {
    return authSession;
  }

  if (!authSession || !authSession.user) {
    return err('User not authenticated', { user: 'Session does not contain user data' });
  }

  const session = authSession;

  // Get existing authenticators to exclude
  const existingAuthsResult = await repo.getAuthenticatorsByUserId(userId);
  if (isError(existingAuthsResult)) {
    logger.error('passkey_options_get_existing_failed', { userId, error: existingAuthsResult });
    return existingAuthsResult;
  }

  // Map to include both ID and transports for proper exclusion
  const excludeCredentials = existingAuthsResult.map((auth: Authenticator) => ({ id: auth.id, transports: auth.transports as string[] }));
  const challenge = generateChallenge();
  const options = createRegistrationOptions(rpName, rpId, session.user.email, session.user.displayName, challenge, excludeCredentials);

  return ok({ challenge, options });
}
