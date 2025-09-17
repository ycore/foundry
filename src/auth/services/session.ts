import { createWorkersKVSessionStorage } from '@react-router/cloudflare';
import type { Result } from '@ycore/forge/result';
import { err, ok } from '@ycore/forge/result';
import { getBindings, isProduction, UNCONFIGURED } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import type { SessionData, SessionFlashData } from '../@types/auth.types';
import { getAuthConfig } from '../auth-config.context';

const challengeKvTemplate = (username: string): string => `challenge:${username}`;

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

// Get challenge session by username
export async function getChallengeSession(username: string, context: Readonly<RouterContextProvider>): Promise<Result<string | null>> {
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

    const challengeKey = challengeKvTemplate(username);
    const challengeData = await kv.get(challengeKey);
    return ok(challengeData);
  } catch (error) {
    return err('Failed to get challenge session', { username, error });
  }
}

// Create challenge session with username-based key
export async function createChallengeSession(username: string, challenge: string, context: Readonly<RouterContextProvider>): Promise<Result<void>> {
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

    const challengeKey = challengeKvTemplate(username);
    // Set TTL to 5 minutes (300 seconds) for challenge sessions
    await kv.put(challengeKey, challenge, { expirationTtl: 300 });

    return ok(undefined);
  } catch (error) {
    return err('Failed to create challenge session', { username, error });
  }
}

// Clean up challenge session
export async function cleanupChallengeSession(username: string, context: Readonly<RouterContextProvider>): Promise<Result<void>> {
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

    const challengeKey = challengeKvTemplate(username);
    await kv.delete(challengeKey);

    return ok(undefined);
  } catch (error) {
    return err('Failed to cleanup challenge session', { username, error });
  }
}

// Create new session (for authenticated users only)
export async function createAuthSession(context: Readonly<RouterContextProvider>, sessionData: SessionData): Promise<Result<string>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession();

    session.set('user', sessionData.user);
    if (sessionData.challenge) {
      session.set('challenge', sessionData.challenge);
    }

    const cookie = await sessionStorage.commitSession(session);
    return ok(cookie);
  } catch (error) {
    return err('Failed to create session', { error });
  }
}

// Create challenge-only session with proper cleanup
export async function createChallengeOnlySession(username: string, challenge: string, context: Readonly<RouterContextProvider>): Promise<Result<string>> {
  try {
    // First, cleanup any existing challenge session for this username
    await cleanupChallengeSession(username, context);

    // Create new challenge session in KV with TTL
    await createChallengeSession(username, challenge, context);

    // Create minimal session cookie (just for CSRF protection)
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession();

    session.set('challenge', challenge);
    session.set('username', username);

    const cookie = await sessionStorage.commitSession(session);
    return ok(cookie);
  } catch (error) {
    return err('Failed to create challenge session', { username, error });
  }
}

// Destroy session with proper cookie clearing
export async function destroyAuthSession(request: Request, context: Readonly<RouterContextProvider>): Promise<Result<string>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));

    // Get username from session for cleanup
    const username = session.get('username');
    if (username) {
      await cleanupChallengeSession(username, context);
    }

    // Destroy the session and get the clearing cookie
    const cookie = await sessionStorage.destroySession(session);
    return ok(cookie);
  } catch (error) {
    return err('Failed to destroy session', { error });
  }
}
