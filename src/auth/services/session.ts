import { createWorkersKVSessionStorage } from '@react-router/cloudflare';
import type { AppResult } from '@ycore/forge/result';
import { returnFailure, returnSuccess } from '@ycore/forge/result';
import { getBindings } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import type { SessionData, SessionFlashData } from '../@types/auth.types';

export function createAuthSessionStorage(context: Readonly<RouterContextProvider>) {
  const env = getBindings(context);
  const secret = env.AUTH_SESSION_SECRET_KEY || 'default-session-secret';

  return createWorkersKVSessionStorage<SessionData, SessionFlashData>({
    kv: env.ADMIN_KV,
    cookie: {
      name: '__auth_session',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      secrets: [secret],
      secure: env.ENVIRONMENT === 'production',
    },
  });
}

// Get session from request
export async function getAuthSession(request: Request, context: Readonly<RouterContextProvider>): Promise<AppResult<SessionData | null>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));

    const user = session.get('user');
    const challenge = session.get('challenge');

    if (!user) {
      return returnSuccess(null);
    }

    return returnSuccess({ user, challenge });
  } catch (error) {
    return returnFailure({ message: 'Failed to get session', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Get challenge session by username
export async function getChallengeSession(username: string, context: Readonly<RouterContextProvider>): Promise<AppResult<string | null>> {
  try {
    const env = getBindings(context);
    const challengeKey = `challenge:${username}`;
    
    const challengeData = await env.ADMIN_KV.get(challengeKey);
    return returnSuccess(challengeData);
  } catch (error) {
    return returnFailure({ message: 'Failed to get challenge session', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Create challenge session with username-based key
export async function createChallengeSession(username: string, challenge: string, context: Readonly<RouterContextProvider>): Promise<AppResult<void>> {
  try {
    const env = getBindings(context);
    const challengeKey = `challenge:${username}`;
    
    // Set TTL to 5 minutes (300 seconds) for challenge sessions
    await env.ADMIN_KV.put(challengeKey, challenge, { expirationTtl: 300 });
    
    return returnSuccess(undefined);
  } catch (error) {
    return returnFailure({ message: 'Failed to create challenge session', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Clean up challenge session
export async function cleanupChallengeSession(username: string, context: Readonly<RouterContextProvider>): Promise<AppResult<void>> {
  try {
    const env = getBindings(context);
    const challengeKey = `challenge:${username}`;
    
    await env.ADMIN_KV.delete(challengeKey);
    
    return returnSuccess(undefined);
  } catch (error) {
    return returnFailure({ message: 'Failed to cleanup challenge session', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Create new session (for authenticated users only)
export async function createAuthSession(context: Readonly<RouterContextProvider>, sessionData: SessionData): Promise<AppResult<string>> {
  try {
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession();

    session.set('user', sessionData.user);
    if (sessionData.challenge) {
      session.set('challenge', sessionData.challenge);
    }

    const cookie = await sessionStorage.commitSession(session);
    return returnSuccess(cookie);
  } catch (error) {
    return returnFailure({ message: 'Failed to create session', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Create challenge-only session with proper cleanup
export async function createChallengeOnlySession(username: string, challenge: string, context: Readonly<RouterContextProvider>): Promise<AppResult<string>> {
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
    return returnSuccess(cookie);
  } catch (error) {
    return returnFailure({ message: 'Failed to create challenge session', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Destroy session with proper cookie clearing
export async function destroyAuthSession(request: Request, context: Readonly<RouterContextProvider>): Promise<AppResult<string>> {
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
    return returnSuccess(cookie);
  } catch (error) {
    return returnFailure({ message: 'Failed to destroy session', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
