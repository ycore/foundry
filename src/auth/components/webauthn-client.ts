import { encodeBase64url } from '@oslojs/encoding';

import type { WebAuthnCredentialResponse } from '../@types/auth.component.types';

/**
 * WebAuthn error messages mapped by error name
 * Following functional programming pattern: Map over Switch
 */
const WEBAUTHN_REGISTRATION_ERROR_MESSAGES = new Map<string, string>([
  ['NotAllowedError', 'Registration was cancelled or timed out. Please try again.'],
  ['InvalidStateError', 'This authenticator is already registered. Please try a different device.'],
  ['NotSupportedError', 'This authenticator is not supported. Please try a different device.'],
  ['SecurityError', 'Security error occurred. Please ensure you are on a secure connection.'],
  ['UnknownError', 'An unknown error occurred during registration. Please try again.'],
  ['ConstraintError', 'Authenticator constraints not satisfied. Please try a different device.'],
]);

const WEBAUTHN_AUTHENTICATION_ERROR_MESSAGES = new Map<string, string>([
  ['NotAllowedError', 'Authentication was cancelled or timed out. Please try again.'],
  ['InvalidStateError', 'No authenticator found for this account. Please use a registered device.'],
  ['NotSupportedError', 'This authenticator is not supported for authentication.'],
  ['SecurityError', 'Security error occurred. Please ensure you are on a secure connection.'],
  ['UnknownError', 'An unknown error occurred during authentication. Please try again.'],
  ['ConstraintError', 'Authenticator constraints not satisfied for authentication.'],
]);

/**
 * Transform WebAuthn error into user-friendly message; pure function - no side effects
 */
function transformWebAuthnError(error: unknown, errorMessages: Map<string, string>, defaultMessage: string): Error {
  if (!(error instanceof Error)) {
    return new Error(defaultMessage);
  }

  const message = errorMessages.get(error.name) ?? `${defaultMessage}: ${error.message}`;
  return new Error(message);
}

/**
 * Convert attestation response to credential response format - handles credential transformation
 */
function convertAttestationResponse(credential: PublicKeyCredential): WebAuthnCredentialResponse {
  const response = credential.response as AuthenticatorAttestationResponse;
  const transports = response.getTransports ? response.getTransports() : [];
  const authenticatorAttachment = credential.authenticatorAttachment as AuthenticatorAttachment | null;

  return {
    id: credential.id,
    rawId: encodeBase64url(new Uint8Array(credential.rawId)),
    type: credential.type,
    authenticatorAttachment,
    response: {
      attestationObject: encodeBase64url(new Uint8Array(response.attestationObject)),
      clientDataJSON: encodeBase64url(new Uint8Array(response.clientDataJSON)),
      transports: transports as AuthenticatorTransport[],
    },
  };
}

/**
 * Convert assertion response to credential response format - handles credential transformation
 */
function convertAssertionResponse(credential: PublicKeyCredential): WebAuthnCredentialResponse {
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: encodeBase64url(new Uint8Array(credential.rawId)),
    type: credential.type,
    response: {
      authenticatorData: encodeBase64url(new Uint8Array(response.authenticatorData)),
      clientDataJSON: encodeBase64url(new Uint8Array(response.clientDataJSON)),
      signature: encodeBase64url(new Uint8Array(response.signature)),
      userHandle: response.userHandle ? encodeBase64url(new Uint8Array(response.userHandle)) : undefined,
    },
  };
}

/**
 * Client-side WebAuthn registration with enhanced error handling
 */
export async function startRegistration(options: PublicKeyCredentialCreationOptions): Promise<WebAuthnCredentialResponse> {
  try {
    const credential = (await navigator.credentials.create({ publicKey: options })) as PublicKeyCredential;

    if (!credential?.response) {
      throw new Error('Failed to create credential');
    }

    return convertAttestationResponse(credential);
  } catch (error) {
    throw transformWebAuthnError(error, WEBAUTHN_REGISTRATION_ERROR_MESSAGES, 'Registration failed with an unknown error');
  }
}

/**
 * Client-side WebAuthn authentication with enhanced error handling
 */
export async function startAuthentication(options: PublicKeyCredentialRequestOptions): Promise<WebAuthnCredentialResponse> {
  try {
    const credential = (await navigator.credentials.get({
      publicKey: options,
    })) as PublicKeyCredential;

    if (!credential?.response) {
      throw new Error('Failed to get credential');
    }

    return convertAssertionResponse(credential);
  } catch (error) {
    throw transformWebAuthnError(error, WEBAUTHN_AUTHENTICATION_ERROR_MESSAGES, 'Authentication failed with an unknown error');
  }
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
  return !!(typeof window !== 'undefined' && window.PublicKeyCredential && navigator?.credentials && typeof navigator.credentials.create === 'function' && typeof navigator.credentials.get === 'function');
}

/**
 * Check if platform authenticator is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Get browser capabilities for WebAuthn
 */
export async function getBrowserCapabilities(): Promise<{ webauthnSupported: boolean; platformAuthenticatorAvailable: boolean; conditionalMediationSupported: boolean; }> {
  const webauthnSupported = isWebAuthnSupported();
  const platformAuthenticatorAvailable = webauthnSupported ? await isPlatformAuthenticatorAvailable() : false;

  let conditionalMediationSupported = false;
  if (webauthnSupported && 'PublicKeyCredential' in window) {
    try {
      // Check if conditional mediation is supported (for passkey autofill)
      conditionalMediationSupported = await window.PublicKeyCredential.isConditionalMediationAvailable();
    } catch {
      conditionalMediationSupported = false;
    }
  }

  return { webauthnSupported, platformAuthenticatorAvailable, conditionalMediationSupported };
}

/**
 * Get user-friendly error message for WebAuthn operations
 */
export function getWebAuthnErrorMessage(error: Error, operation: 'registration' | 'authentication'): string {
  const operationText = operation === 'registration' ? 'add a passkey' : 'sign in';

  // Map of message patterns to user-friendly messages
  const messagePatterns = new Map<string, string>([
    ['cancelled', `The ${operationText} process was cancelled or timed out. Please try again.`],
    ['timed out', `The ${operationText} process was cancelled or timed out. Please try again.`],
    ['already registered', 'This device is already registered. Please try a different device.'],
    ['not supported', `This device or browser doesn't support the required security features. Please try a different device.`],
    ['Security error', 'Please ensure you are using a secure connection (HTTPS) and try again.'],
  ]);

  for (const [pattern, message] of messagePatterns) {
    if (error.message.includes(pattern)) {
      return message;
    }
  }

  // Fallback to original error message
  return `Failed to ${operationText}. ${error.message}`;
}
