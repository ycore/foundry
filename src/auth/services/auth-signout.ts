import { logger } from '@ycore/forge/logger';
import { isError } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';
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

  // Get route config from context or use default
  const routeConfig = context.get('routeConfig' as any) || { auth: { signin: '/foundry/auth/signin' } };

  return redirect(routeConfig.auth.signin, {
    headers: {
      'Set-Cookie': !isError(destroyResult) ? destroyResult : '',
    },
  });
}

export async function signoutLoader() {
  // Get route config from context or use default
  const routeConfig = { auth: { signedout: '/foundry/auth/signin' } };
  return redirect(routeConfig.auth.signedout);
}
