import { encodeBase64url } from '@oslojs/encoding';
import type { WebAuthnCredentialResponse } from '../@types/auth.component.types';

/**
 * Client-side WebAuthn registration
 */
export async function startRegistration(options: PublicKeyCredentialCreationOptions): Promise<WebAuthnCredentialResponse> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: options
    }) as PublicKeyCredential;

    if (!credential || !credential.response) {
      throw new Error('Failed to create credential');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    // Convert to base64url for transmission
    return {
      id: credential.id,
      rawId: encodeBase64url(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        attestationObject: encodeBase64url(new Uint8Array(response.attestationObject)),
        clientDataJSON: encodeBase64url(new Uint8Array(response.clientDataJSON))
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Registration was cancelled or timed out');
      }
      if (error.name === 'InvalidStateError') {
        throw new Error('An authenticator is already registered for this account');
      }
      throw error;
    }
    throw new Error('Registration failed');
  }
}

/**
 * Client-side WebAuthn authentication
 */
export async function startAuthentication(options: PublicKeyCredentialRequestOptions): Promise<WebAuthnCredentialResponse> {
  try {
    const credential = await navigator.credentials.get({
      publicKey: options
    }) as PublicKeyCredential;

    if (!credential || !credential.response) {
      throw new Error('Failed to get credential');
    }

    const response = credential.response as AuthenticatorAssertionResponse;

    // Convert to base64url for transmission
    return {
      id: credential.id,
      rawId: encodeBase64url(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        authenticatorData: encodeBase64url(new Uint8Array(response.authenticatorData)),
        clientDataJSON: encodeBase64url(new Uint8Array(response.clientDataJSON)),
        signature: encodeBase64url(new Uint8Array(response.signature)),
        userHandle: response.userHandle ? encodeBase64url(new Uint8Array(response.userHandle)) : undefined
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Authentication was cancelled or timed out');
      }
      if (error.name === 'InvalidStateError') {
        throw new Error('No authenticator found for this account');
      }
      throw error;
    }
    throw new Error('Authentication failed');
  }
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    navigator?.credentials &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
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
