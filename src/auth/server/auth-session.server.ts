import { createWorkersKVSessionStorage } from '@react-router/cloudflare';
import type { AppLoadContext, SessionStorage } from 'react-router';

import { contextEnv, isDev, isProduction } from '../../common/services/env.js';
import { type EmailMessage, emailOptions, sendMail } from '../../email/services/email.server.js';
import type { Senders } from '../config/config.auth.js';
import type { ProtectedUser } from '../config/db/schema.js';
import { authRepository } from '../server/auth-repository.server.js';
import type { AuthError } from '../utils/error-auth.js';
import type { Credentials, Verification } from '../utils/valid-auth.js';
import { type VerifyLinkOptions, authTOTP } from './auth-verify.server.js';
import { resolveAuthenticator } from './authenticator.server.js';
export type { UserPassword } from '../config/db/schema.js';

export type SessionContext = {
  user: ProtectedUser;
};

export type ProtectedUserEmail = ProtectedUser['email'];

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#smart_self-overwriting_lazy_getters
// export const resolveSessionStorage = (() => {
//   let lazySessionInstance: ReturnType<typeof sessionStorageFactory> | undefined;

//   return (context: AppLoadContext, request: Request) => (lazySessionInstance ??= sessionStorageFactory(context, request));
// })();

export const resolveSessionStorage = (() => {
  let lazySessionInstance: Promise<SessionStorage<SessionContext, SessionContext>> | undefined;

  return async (context: AppLoadContext, request: Request): Promise<SessionStorage<SessionContext, SessionContext>> => {
    if (!lazySessionInstance) {
      lazySessionInstance = Promise.resolve(sessionStorageFactory(context, request));
    }
    return await lazySessionInstance;
  };
})();

export async function sessionStorageFactory(context: AppLoadContext, request: Request) {
  const authConfig = await context.di.authConfig();

  if (!contextEnv(context).ADMIN_KV) {
    throw new Error('Missing KV storage configuration');
  }

  if (!contextEnv(context).AUTH_SESSION_SECRET_KEY) {
    throw new Error('Missing KV storage configuration');
  }

  return createWorkersKVSessionStorage<SessionContext>({
    kv: contextEnv(context).ADMIN_KV,
    cookie: {
      maxAge: authConfig.cookie.maxAge,
      name: '_auth',
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secrets: [contextEnv(context).AUTH_SESSION_SECRET_KEY],
      secure: isProduction(context),
      ...(isProduction(context) ? { domain: new URL(request.url).hostname } : {}),
    },
  });
}
type ProtectedUserResponse = [null, user: ProtectedUser, headers: Headers] | [error: Error, undefined, headers: Headers];

export const AuthSession = {
  getSessionUser: async (context: AppLoadContext, request: Request): Promise<[ProtectedUser | null]> => {
    const authSessionStorage = await resolveSessionStorage(context, request);
    const session = await authSessionStorage.getSession(request.headers.get('cookie'));
    const user = session.get('user');

    if (!user) return [null];
    return [user];
  },
  isAuthenticated: async (context: AppLoadContext, request: Request): Promise<boolean> => {
    const [user] = await AuthSession.getSessionUser(context, request);
    return !!user;
  },
  notAuthenticated: async (context: AppLoadContext, request: Request): Promise<boolean> => {
    return !(await AuthSession.isAuthenticated(context, request));
  },
  isSessionUser: async (context: AppLoadContext, request: Request, email: ProtectedUser['email']): Promise<boolean> => {
    const [sessionUser] = await AuthSession.getSessionUser(context, request);
    return email === sessionUser?.email;
  },
  sendVerification: async (context: AppLoadContext, request: Request, userEmail: ProtectedUser['email']) => {
    const authConfig = await context.di.authConfig();

    const code = await authTOTP.create(userEmail, context);
    const linkRef = <VerifyLinkOptions>{ action: 'validate', code, email: userEmail };

    const verifyLink = await authTOTP.link(authConfig.routes.auth.confirm, linkRef, context, request);
    if (authConfig.email.send) {
      const message = await authMailTemplate(context, code, verifyLink);
      const sendTo = isDev(context) && authConfig.DEV?.email_to ? authConfig.DEV?.email_to : userEmail;
      const options = await emailOptions(sendTo, context);
      const emailService: Senders = authConfig.email?.active as Senders;
      try {
        await sendMail[emailService]({ message, options });
      } catch (error) {
        console.error(error.message);
        throw new Error(error);
      }
    }
  },
  setSessionUser: async (context: AppLoadContext, request: Request, strategy: string): Promise<ProtectedUserResponse> => {
    const authSessionStorage = await resolveSessionStorage(context, request);
    const session = await authSessionStorage.getSession(request.headers.get('cookie'));

    const authenticator = resolveAuthenticator(context);
    const [error, user] = await authenticator.authenticate(strategy, request);
    const headers = new Headers();

    if (error) {
      headers.append('set-cookie', await authSessionStorage.commitSession(session));
      return [error, undefined, headers];
    }

    session.set('user', user);

    headers.append('set-cookie', await authSessionStorage.commitSession(session));
    return [null, user, headers];
  },
  unsetSessionUser: async (context: AppLoadContext, request: Request): Promise<[headers: Headers]> => {
    const authSessionStorage = await resolveSessionStorage(context, request);

    const session = await authSessionStorage.getSession(request.headers.get('cookie'));
    const headers = new Headers();

    headers.append('set-cookie', await authSessionStorage.destroySession(session));
    return [headers];
  },
  destroySessionUser: async (context: AppLoadContext, request: Request): Promise<[AuthError, undefined] | [null, Headers]> => {
    const [sessionUser] = await AuthSession.getSessionUser(context, request);

    if (sessionUser) {
      await authRepository.delete(context, sessionUser.id);
    }
    const [headers] = await AuthSession.unsetSessionUser(context, request);

    return [null, headers];
  },
  verifySessionUser: async (context: AppLoadContext, request: Request, verify: Verification): Promise<[AuthError, Headers] | [null, Headers]> => {
    const authSessionStorage = await resolveSessionStorage(context, request);
    const session = await authSessionStorage.getSession(request.headers.get('cookie'));

    const [verifyError, verified] = await authTOTP.verify(verify.email, verify.code, context);

    if (verifyError) {
      request.headers.append('set-cookie', await authSessionStorage.commitSession(session));
      return [verifyError, request.headers];
    }

    const [updateError, user] = await authRepository.updateUserVerified(context, verify.email, verified);

    if (updateError) {
      request.headers.append('set-cookie', await authSessionStorage.commitSession(session));
      return [updateError, request.headers];
    }

    session.set('user', user);
    request.headers.append('set-cookie', await authSessionStorage.commitSession(session));

    return [null, request.headers];
  },
  updateUserPassword: async (context: AppLoadContext, request: Request, credentials: Credentials): Promise<ProtectedUserResponse> => {
    const authSessionStorage = await resolveSessionStorage(context, request);
    const session = await authSessionStorage.getSession(request.headers.get('cookie'));

    const [error, user] = await authRepository.updateStoredPassword(context, credentials.email, credentials.password);

    const headers = new Headers();

    if (error) {
      headers.append('set-cookie', await authSessionStorage.commitSession(session));
      return [error, undefined, headers];
    }

    session.set('user', user);

    headers.append('set-cookie', await authSessionStorage.commitSession(session));
    return [null, user, headers];
  },
};

const authMailTemplate = async (context: AppLoadContext, code: string, verifyLink?: string): Promise<EmailMessage> => {
  return {
    subject: `Your verification code ${isDev(context) ? code : ''}`,
    text: `OTP verification code: ${code}`,
    html: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>OTP Verification Code</title>
      </head>
      <body style="max-width: 75%; margin: 0 auto; text-align: center;">
        <div style="color: #707070; margin-bottom: 1rem; margin-top: 1rem">Please verify your account using the code below:</div>
        <h1 style="color: #505050; font-size: 1.75rem; font-weight: 400; margin-bottom: 2rem">
          Code: <span style="color: #505050; font-size: 3.75rem; font-weight: 700">${code}</span>
        </h1>
        ${
          verifyLink &&
          ` <p style="color: #303030; margin-bottom: 1rem">Alternatively, please follow the verification link below.</p>
            <p style="color: #505050; font-size: 1.25rem; margin-bottom: 1rem">
              <a target="_blank" href="${verifyLink}">Follow link to verify ${code}</a>
            </p>`
        }
      </body>
    </html>
  `,
  };
};
