import { logger } from '@ycore/forge/logger';
import { isError } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';

import { defaultAuthRoutes } from '../auth.config';
import { getAuthConfig } from '../auth.context';
import { destroyAuthSession } from './session';

export interface SignOutActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

export async function signoutAction({ request, context }: SignOutActionArgs) {
  const destroyResult = await destroyAuthSession(request, context);

  if (isError(destroyResult)) {
    logger.error('Failed to destroy session:', destroyResult.message);
  }

  const authConfig = getAuthConfig(context);
  const redirectTo = authConfig?.routes.signedout || defaultAuthRoutes.signedout;

  return redirect(redirectTo, { headers: { 'Set-Cookie': !isError(destroyResult) ? destroyResult : '' } });
}

export async function signoutLoader({ context }: { context: Readonly<RouterContextProvider> }) {
  const authConfig = getAuthConfig(context);
  const redirectTo = authConfig?.routes.signedout || defaultAuthRoutes.signedout;

  return redirect(redirectTo);
}
