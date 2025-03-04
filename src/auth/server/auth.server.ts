import { type ActionFunctionArgs, type LoaderFunctionArgs, type UNSAFE_DataWithResponseInit, redirect } from 'react-router';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { base64Decode } from '../../common/utils/crypto.js';
import { checkCsrfToken } from '../../form/server/csrf.server.js';
import { checkHoneypot } from '../../form/server/honeypot.server.js';
import { getMultiAction } from '../../form/server/multi-action.server.js';
import { safeParse } from '../../form/validate.js';
import { toast } from '../../vendor/toast.js';
import type { VerifyActionInputProps, VerifyActions } from '../components/VerifyActionInput.js';
import { type AuthConfigPromise, resolveAuthConfig } from '../config/resolve-config.js';
import { AuthSession, type ProtectedUserEmail } from '../server/auth-session.server.js';
import { createVerifyUrl } from '../utils/auth-utils.js';
import { CredentialSchema, VerificationSchema } from '../utils/valid-auth.js';

type VerifyActionData = {
  errors?: {
    email?: ProtectedUserEmail | [ProtectedUserEmail, ...ProtectedUserEmail[]];
    code?: [string, ...string[]];
    form?: [string, ...string[]];
  };
};

type AuthActionData = {
  errors?: {
    email?: ProtectedUserEmail | [ProtectedUserEmail, ...ProtectedUserEmail[]];
  };
};

interface AuthHandlers {
  signinAction: ({ ...args }: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<AuthActionData>>;
  signinLoader: ({ ...args }: LoaderFunctionArgs) => Promise<{ authConfig: AuthConfigPromise }>;
  signoutAction: ({ ...args }: LoaderFunctionArgs) => Promise<Response>;
  signupAction: ({ ...args }: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<AuthActionData>>;
  signupLoader: ({ ...args }: LoaderFunctionArgs) => Promise<{ authConfig: AuthConfigPromise }>;
  forgotAction: ({ ...args }: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<AuthActionData>>;
  forgotLoader: ({ ...args }: LoaderFunctionArgs) => Promise<{ authConfig: AuthConfigPromise }>;
  verifyAction: ({ ...args }: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<VerifyActionData> | undefined>;
  verifyLoader: ({ ...args }: LoaderFunctionArgs) => Promise<{ action: VerifyActionInputProps['value']; code?: string; email?: ProtectedUserEmail }>;
  confirmLoader: ({ ...args }: LoaderFunctionArgs) => Promise<Response>;
  destroyUserAction: ({ ...args }: ActionFunctionArgs) => Promise<Response>;
}

export const Auth: AuthHandlers = {
  signinAction: async ({ ...args }) => {
    const authConfig = await resolveAuthConfig();
    const clonedFormData = await args.request.clone().formData();
    await checkCsrfToken(args.context, clonedFormData, args.request.headers);
    await checkHoneypot(args.context, clonedFormData);

    const validated = safeParse(clonedFormData, CredentialSchema, ['email', 'password']);
    if (!validated.success) {
      return toast.dataWithError({ errors: validated.errors }, JSON.stringify(validated.errors), { headers: args.request.headers });
    }

    const [error, user, headers] = await AuthSession.setSessionUser(args.context, args.request, 'signin-strategy');

    if (error) {
      return toast.redirectWithError(authConfig.routes.auth.signin, error.message, { headers });
    }

    if (!user.emailVerified) {
      const verifyUrl = createVerifyUrl(authConfig.routes.auth.verify, '', user.email);

      await AuthSession.sendVerification(args.context, args.request, user.email);
      return toast.redirectWithInfo(verifyUrl, 'Please verify the authenticated user', { headers });
    }

    return toast.redirectWithSuccess(authConfig.routes.auth.signedin, 'Sign-in successful', { headers });
  },
  signinLoader: async ({ ...args }) => {
    const authConfig = await resolveAuthConfig();

    if (await AuthSession.isAuthenticated(args.context, args.request)) {
      throw redirect(authConfig.routes.auth.signedin);
    }

    return { authConfig };
  },
  signoutAction: async ({ ...args }) => {
    const authConfig = await resolveAuthConfig();
    const [headers] = await AuthSession.unsetSessionUser(args.context, args.request);

    return toast.redirectWithSuccess(authConfig.routes.auth.signedout, 'Signed out', { headers });
  },
  signupAction: async ({ ...args }) => {
    const authConfig = await resolveAuthConfig();
    const clonedFormData = await args.request.clone().formData();
    await checkCsrfToken(args.context, clonedFormData, args.request.headers);
    await checkHoneypot(args.context, clonedFormData);

    const validated = safeParse(clonedFormData, CredentialSchema, ['email', 'password']);
    if (!validated.success) {
      return toast.dataWithError({ errors: validated.errors }, JSON.stringify(validated.errors), { headers: args.request.headers });
    }

    const [error, user, headers] = await AuthSession.setSessionUser(args.context, args.request, 'signup-strategy');

    if (error) {
      return toast.redirectWithError(authConfig.routes.auth.signin, error.message, { headers });
    }

    if (!user.emailVerified) {
      const verifyUrl = createVerifyUrl(authConfig.routes.auth.verify, '', user.email);

      await AuthSession.sendVerification(args.context, args.request, user.email);
      return toast.redirectWithInfo(verifyUrl, 'Please verify the authenticated user', { headers });
    }

    return toast.redirectWithSuccess(authConfig.routes.auth.signedin, 'Sign-in successful', { headers });
  },
  signupLoader: async ({ ...args }) => {
    const authConfig = await resolveAuthConfig();
    if (await AuthSession.isAuthenticated(args.context, args.request)) {
      throw redirect(authConfig.routes.auth.signedin);
    }

    return { authConfig };
  },
  forgotAction: async ({ ...args }) => {
    const authConfig = await resolveAuthConfig();
    const clonedFormData = await args.request.clone().formData();
    await checkCsrfToken(args.context, clonedFormData, args.request.headers);
    await checkHoneypot(args.context, clonedFormData);

    const validated = safeParse(clonedFormData, CredentialSchema, ['email', 'password']);
    if (!validated.success) {
      return toast.dataWithError({ errors: validated.errors }, JSON.stringify(validated.errors), { headers: args.request.headers });
    }

    const [error, user, headers] = await AuthSession.updateUserPassword(args.context, args.request, validated.data);
    if (error) {
      return toast.dataWithError({ errors: { email: error.message } }, JSON.stringify(error.message), { headers });
    }

    if (!user.emailVerified) {
      const verifyUrl = createVerifyUrl(authConfig.routes.auth.verify, '', user.email);

      await AuthSession.sendVerification(args.context, args.request, user.email);
      return toast.redirectWithInfo(verifyUrl, 'Please verify the authenticated user', { headers });
    }

    return toast.redirectWithSuccess(authConfig.routes.auth.signedin, 'Sign-in successful', { headers });
  },
  forgotLoader: async () => {
    const authConfig = await resolveAuthConfig();

    return { authConfig };
  },
  verifyAction: async ({ ...args }) => {
    const authConfig = await resolveAuthConfig();
    const clonedFormData = await args.request.clone().formData();
    await checkCsrfToken(args.context, clonedFormData, args.request.headers);
    await checkHoneypot(args.context, clonedFormData);
    const action = (await getMultiAction(clonedFormData)) as VerifyActions;
    const operation = verifyAction[action];
    if (!operation) {
      throw new Error(`Unsupported action: ${action}`);
    }

    return operation(authConfig, args);
  },
  verifyLoader: async ({ ...args }) => {
    const token = args.params?.token ? await JSON.parse(base64Decode(args.params.token)) : undefined;

    return { action: token?.action, code: token?.code, email: token?.email };
  },
  confirmLoader: async ({ ...args }) => {
    // TODO: valibot validate parameters

    const authConfig = await resolveAuthConfig();
    // TODO: notAuthenticated check handles /validate action, can add it back in if we allow the /verify sction to do a signin before verifying
    // if (await AuthSession.notAuthenticated(context, request)) {
    //   throw redirect(authConfig.routes.auth.signedout);
    // }

    if (!args.params.token) {
      throw redirect(authConfig.routes.auth.signin);
    }

    throw redirect(safeRedirect([authConfig.routes.auth.verify, args.params.token].join('/'), authConfig.routes.auth.signin));
  },
  destroyUserAction: async ({ ...args }) => {
    const authConfig = await resolveAuthConfig();

    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const [_, headers] = await AuthSession.destroySessionUser(args.context, args.request);
    return toast.redirectWithSuccess(authConfig.routes.auth.signedout, 'Account removed', { headers });
  },
};

const verifyAction: Record<VerifyActions, (authConfig: AuthConfigPromise, args: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<VerifyActionData> | undefined>> = {
  resend: async (authConfig, args) => {
    const [user] = await AuthSession.getSessionUser(args.context, args.request);
    if (!user) {
      throw toast.redirectWithWarning(authConfig.routes.auth.signedout, 'Signed Out', { headers: args.request.headers });
    }

    const verifyUrl = createVerifyUrl(authConfig.routes.auth.verify, '', user.email);

    await AuthSession.sendVerification(args.context, args.request, user.email);
    return toast.redirectWithInfo(verifyUrl, 'Please verify the authenticated user', { headers: args.request.headers });
  },
  validate: async (authConfig, args) => {
    const validated = safeParse(await args.request.formData(), VerificationSchema, ['email', 'code']);
    if (!validated.success) {
      return toast.dataWithError({ errors: validated.errors }, JSON.stringify(validated.errors), { headers: args.request.headers });
    }

    if (!AuthSession.isSessionUser(args.context, args.request, validated.data.email)) {
      return toast.dataWithError({ errors: { email: ['Email does not match signed in user'] } }, 'Email does not match signed in user', { headers: args.request.headers });
    }

    const [error, headers] = await AuthSession.verifySessionUser(args.context, args.request, validated.data);

    if (error) {
      if (error.kind === 'USER VERIFICATION') {
        throw toast.redirectWithError(authConfig.routes.auth.signedout, 'User verification error', { headers });
      }

      return toast.dataWithError({ errors: { email: error.message } }, error.message, { headers });
    }

    return toast.redirectWithSuccess(authConfig.routes.auth.signedin, 'Verification complete', { headers });
  },
};
