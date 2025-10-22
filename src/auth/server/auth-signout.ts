import { getContext } from '@ycore/forge/context';
import { logger } from '@ycore/forge/logger';
import { flattenError, isError, isSystemError, respondRedirect } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';

import { defaultAuthRoutes } from '../auth.config';
import { authConfigContext } from './auth.context';
import { destroyAuthSession } from './session';

export interface SignOutActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

export async function signoutAction({ request, context }: SignOutActionArgs) {
  const destroyResult = await destroyAuthSession(request, context);

  if (isError(destroyResult)) {
    // System error - log session destruction failure
    if (isSystemError(destroyResult)) {
      logger.error('signout_session_destruction_failed', { error: flattenError(destroyResult) });
    }
  }

  const authConfig = getContext(context, authConfigContext);
  const redirectTo = authConfig?.routes.signedout || defaultAuthRoutes.signedout;

  throw respondRedirect(redirectTo, {
    headers: { 'Set-Cookie': !isError(destroyResult) ? destroyResult : '' }
  });
}

export async function signoutLoader({ context }: { context: Readonly<RouterContextProvider> }) {
  const authConfig = getContext(context, authConfigContext);
  const redirectTo = authConfig?.routes.signedout || defaultAuthRoutes.signedout;

  throw respondRedirect(redirectTo);
}
