import type { MiddlewareFunction } from 'react-router';

import { skipCSRFValidation } from '../../secure';

/**
 * Middleware to bypass CSRF validation for WebAuthn operations
 * that use challenge-based verification for security
 */
export const webAuthnCSRFBypassMiddleware: MiddlewareFunction = async ({ request, context }, next) => {
  // Only check POST requests
  if (request.method === 'POST') {
    const clonedRequest = request.clone();
    const formData = await clonedRequest.formData();

    // Check if this is a WebAuthn operation with challenge-based security
    const hasChallenge = formData.has('challenge');
    const hasCredentialData = formData.has('credentialData');

    if (hasChallenge && hasCredentialData) {
      // Set flag to skip CSRF - WebAuthn uses challenge verification
      context.set(skipCSRFValidation, true);
    }
  }

  return next();
};
