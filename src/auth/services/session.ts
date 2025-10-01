import { createWorkersKVSessionStorage } from '@react-router/cloudflare';
import type { Result } from '@ycore/forge/result';
import { err, ok } from '@ycore/forge/result';
import { getBindings, isProduction, UNCONFIGURED } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';

import type { SessionData, SessionFlashData } from '../@types/auth.types';
import { getAuthConfig } from '../auth.context';

const challengeKvTemplate = (email: string): string => `challenge:${email}`;
const challengeUniqueKvTemplate = (challenge: string): string => `challenge-unique:${challenge}`;

export function createAuthSessionStorage(context: Readonly<RouterContextProvider>) {
  const authConfig = getAuthConfig(context);
  if (!authConfig) {
    throw new Error('Auth configuration not found in context. Ensure auth middleware is properly configured.');
  }

  const env = getBindings(context);
  const { session } = authConfig;

  // Check for unconfigured values
  if (session.kvBinding === UNCONFIGURED) {
    throw new Error('Auth session KV binding is not configured. Please specify kvBinding in your auth config.');
  }
  if (session.secretKey === UNCONFIGURED) {
    throw new Error('Auth session secret key is not configured. Please specify secretKey in your auth config.');
  }

  // Get secret from environment using configured key
  const secret = env[session.secretKey as keyof typeof env] as string || 'default-session-secret';

  // Get KV binding using configured name
  const kv = env[session.kvBinding as keyof typeof env] as KVNamespace;
  if (!kv) {
    throw new Error(`KV binding '${session.kvBinding}' not found in environment`);
  }

  return createWorkersKVSessionStorage<SessionData, SessionFlashData>({
    kv,
    cookie: {
      name: session.cookie.name,
      httpOnly: session.cookie.httpOnly,
      maxAge: session.cookie.maxAge,
      path: session.cookie.path,
      sameSite: session.cookie.sameSite,
      secrets: [secret],
      secure: (session.cookie.secure === 'auto') ? isProduction(context) : session.cookie.secure ?? false,
    },
  });
}

// Get session from request
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


// Verify challenge uniqueness
export async function verifyChallengeUniqueness(challenge: string, context: Readonly<RouterContextProvider>): Promise<Result<boolean>> {
  try {
    const authConfig = getAuthConfig(context);
    if (!authConfig) {
      throw new Error('Auth configuration not found in context');
    }

    const env = getBindings(context);
    const kv = env[authConfig.session.kvBinding as keyof typeof env] as KVNamespace;
    if (!kv) {
      throw new Error(`KV binding '${authConfig.session.kvBinding}' not found in environment`);
    }

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


// Clean up challenge session
export async function cleanupChallengeSession(email: string, context: Readonly<RouterContextProvider>): Promise<Result<void>> {
  try {
    const authConfig = getAuthConfig(context);
    if (!authConfig) {
      throw new Error('Auth configuration not found in context');
    }

    const env = getBindings(context);
    const kv = env[authConfig.session.kvBinding as keyof typeof env] as KVNamespace;
    if (!kv) {
      throw new Error(`KV binding '${authConfig.session.kvBinding}' not found in environment`);
    }

    const challengeKey = challengeKvTemplate(email);
    await kv.delete(challengeKey);

    return ok(undefined);
  } catch (error) {
    return err('Failed to cleanup challenge session', { email, error });
  }
}

// Create new session (for authenticated users only)
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


// Destroy session with proper cookie clearing
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
