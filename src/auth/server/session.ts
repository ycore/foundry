import { createWorkersKVSessionStorage } from '@react-router/cloudflare';
import { getContext } from '@ycore/forge/context';
import type { Result } from '@ycore/forge/result';
import { err, ok } from '@ycore/forge/result';
import { getBindings, getKVStore, isProduction, UNCONFIGURED } from '@ycore/forge/services';
import type { RouterContextProvider, Session } from 'react-router';

import type { SessionData, SessionFlashData } from '../@types/auth.types';
import { authConfigContext } from './auth.context';

const challengeKvTemplate = (email: string): string => `challenge:${email}`;
const challengeUniqueKvTemplate = (challenge: string): string => `challenge-unique:${challenge}`;

/**
 * Resolves auth bindings from context following CSRF middleware pattern
 * Centralizes binding resolution with proper error handling
 */
function resolveAuthBindings(context: Readonly<RouterContextProvider>): { secret: string; kv: KVNamespace } {
  const authConfig = getContext(context, authConfigContext);
  if (!authConfig) {
    throw new Error('Auth configuration not found in context. Ensure auth middleware is properly configured.');
  }

  const { session } = authConfig;

  // Check for unconfigured values
  if (session.kvBinding === UNCONFIGURED) {
    throw new Error('Auth session KV binding is not configured. Please specify kvBinding in your auth config.');
  }
  if (session.secretKey === UNCONFIGURED) {
    throw new Error('Auth session secret key is not configured. Please specify secretKey in your auth config.');
  }

  const bindings = getBindings(context);

  const secret = bindings[session.secretKey as keyof typeof bindings] as string | undefined;
  if (!secret) {
    throw new Error(`Auth secret binding '${session.secretKey}' not found in environment. ` + `Available bindings: ${Object.keys(bindings).join(', ')}`);
  }

  const kv = getKVStore(context, session.kvBinding);
  if (!kv) {
    throw new Error(`KV binding '${session.kvBinding}' not found for session. `);
  }

  return { secret, kv };
}

export function createAuthSessionStorage(context: Readonly<RouterContextProvider>) {
  const authConfig = getContext(context, authConfigContext);
  if (!authConfig) {
    throw new Error('Auth configuration not found in context. Ensure auth middleware is properly configured.');
  }

  const { secret, kv } = resolveAuthBindings(context);
  const { session } = authConfig;

  return createWorkersKVSessionStorage<SessionData, SessionFlashData>({
    kv,
    cookie: {
      name: session.cookie.name,
      httpOnly: session.cookie.httpOnly,
      maxAge: session.cookie.maxAge,
      path: session.cookie.path,
      sameSite: session.cookie.sameSite,
      secrets: [secret],
      secure: session.cookie.secure === 'auto' ? isProduction(context) : (session.cookie.secure ?? false),
    },
  });
}

/**
 * Get session from request
 */
export async function getAuthSession(request: Request, context: Readonly<RouterContextProvider>): Promise<Result<SessionData | null>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));

    const user = session.get('user');
    const challenge = session.get('challenge');

    if (!user) {
      return ok(null);
    }

    return ok({ user, challenge });
  } catch (error) {
    return err('Failed to get session', { error });
  }
}

/**
 * Verify challenge uniqueness
 */
export async function verifyChallengeUniqueness(challenge: string, context: Readonly<RouterContextProvider>): Promise<Result<boolean>> {
  try {
    const { kv } = resolveAuthBindings(context);

    const uniqueKey = challengeUniqueKvTemplate(challenge);
    const existing = await kv.get(uniqueKey);

    if (existing) {
      return err('Challenge already used', { challenge });
    }

    // Mark challenge as used with 5 minute TTL
    await kv.put(uniqueKey, 'used', { expirationTtl: 300 });
    return ok(true);
  } catch (error) {
    return err('Failed to verify challenge uniqueness', { challenge, error });
  }
}

/**
 * Clean up challenge session
 */
export async function cleanupChallengeSession(email: string, context: Readonly<RouterContextProvider>): Promise<Result<void>> {
  try {
    const { kv } = resolveAuthBindings(context);

    const challengeKey = challengeKvTemplate(email);
    await kv.delete(challengeKey);

    return ok(undefined);
  } catch (error) {
    return err('Failed to cleanup challenge session', { email, error });
  }
}

/**
 * Create a challenge session for WebAuthn registration/authentication
 *
 * @param context - Router context provider
 * @param challenge - The generated challenge string
 * @returns Result with Set-Cookie header value
 *
 * @example
 * ```ts
 * const challenge = generateChallenge();
 * const result = await createChallengeSession(context, challenge);
 * if (isError(result)) {
 *   return respondError(result);
 * }
 * return respondOk({ challenge }, { headers: { 'Set-Cookie': result } });
 * ```
 */
export async function createChallengeSession(context: Readonly<RouterContextProvider>, challenge: string): Promise<Result<string>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession();

    session.set('challenge', challenge);
    session.set('challengeCreatedAt', Date.now());

    const cookie = await sessionStorage.commitSession(session);
    return ok(cookie);
  } catch (error) {
    return err('Failed to create challenge session', { error });
  }
}

/**
 * Get challenge from session with validation
 *
 * @param request - The incoming request
 * @param context - Router context provider
 * @returns Result with challenge data or error
 *
 * @example
 * ```ts
 * const result = await getChallengeFromSession(request, context);
 * if (isError(result)) {
 *   return respondError(result);
 * }
 * const { challenge, challengeCreatedAt, session } = result;
 * ```
 */
export async function getChallengeFromSession(request: Request, context: Readonly<RouterContextProvider>): Promise<Result<{ challenge: string; challengeCreatedAt: number; session: Session<SessionData, SessionFlashData> }>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));
    const storedChallenge = session.get('challenge');
    const challengeCreatedAt = session.get('challengeCreatedAt');

    if (!storedChallenge || !challengeCreatedAt) {
      return err('Invalid session. Please refresh and try again.', { field: 'general' });
    }

    return ok({ challenge: storedChallenge, challengeCreatedAt, session });
  } catch (error) {
    return err('Failed to get challenge from session', { error });
  }
}

/**
 * Destroy a challenge session (clears challenge data)
 *
 * @param session - The session object to destroy
 * @param context - Router context provider
 * @returns Result with void on success
 *
 * @example
 * ```ts
 * const result = await destroyChallengeSession(session, context);
 * if (isError(result)) {
 *   logger.warning('challenge_cleanup_failed', { error: result });
 * }
 * ```
 */
export async function destroyChallengeSession(session: Session<SessionData, SessionFlashData>, context: Readonly<RouterContextProvider>): Promise<Result<void>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    await sessionStorage.destroySession(session);
    return ok(undefined);
  } catch (error) {
    return err('Failed to destroy challenge session', { error });
  }
}

/**
 * Create new session (for authenticated users only)
 */
export async function createAuthSession(context: Readonly<RouterContextProvider>, sessionData: SessionData): Promise<Result<string>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);

    // SECURITY: Always create a new session to prevent session fixation attacks
    // Don't reuse any existing session - create completely fresh session
    const newSession = await sessionStorage.getSession(); // Creates new session

    newSession.set('user', sessionData.user);
    newSession.set('authenticatedAt', Date.now());

    const cookie = await sessionStorage.commitSession(newSession);
    return ok(cookie);
  } catch (error) {
    return err('Failed to create session', { error });
  }
}

/**
 * Update existing session with new user data
 * Used when user data changes (e.g., email change, profile updates)
 */
export async function updateAuthSession(request: Request, context: Readonly<RouterContextProvider>, sessionData: Partial<SessionData>): Promise<Result<string>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));

    // Update user data if provided
    if (sessionData.user) {
      session.set('user', sessionData.user);
    }

    // Keep the original authenticatedAt timestamp
    // Only update if specifically provided
    if (sessionData.challenge !== undefined) {
      session.set('challenge', sessionData.challenge);
    }

    const cookie = await sessionStorage.commitSession(session);
    return ok(cookie);
  } catch (error) {
    return err('Failed to update session', { error });
  }
}

/**
 * Destroy session with proper cookie clearing
 */
export async function destroyAuthSession(request: Request, context: Readonly<RouterContextProvider>): Promise<Result<string>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));

    // Get email from session for cleanup
    const email = session.get('email');
    if (email) {
      await cleanupChallengeSession(email, context);
    }

    // Destroy the session and get the clearing cookie
    const cookie = await sessionStorage.destroySession(session);
    return ok(cookie);
  } catch (error) {
    return err('Failed to destroy session', { error });
  }
}
