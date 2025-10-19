import { requireContext } from '@ycore/forge/context';
import type { AppLoadContext } from 'react-router';
import { csrfContext } from './csrf.context';

/**
 * Require CSRF token from context
 * Throws Response(500) if middleware didn't run or token is missing
 *
 * @example
 * export const loader = async ({ context }) => {
 *   const token = requireCSRFToken(context);
 *   return { token };
 * };
 */
export function requireCSRFToken(context: AppLoadContext): string {
  const csrfData = requireContext(context, csrfContext, {
    errorMessage: 'CSRF protection not initialized - ensure createCSRFMiddleware() is configured for this route',
    errorStatus: 500,
  });

  if (!csrfData.token) {
    throw new Response('CSRF token generation failed', {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }

  return csrfData.token;
}
