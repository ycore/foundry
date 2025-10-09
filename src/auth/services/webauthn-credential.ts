import { decodeBase64url } from '@oslojs/encoding';

/**
 * Helper function to convert serialized ArrayBuffer back to ArrayBuffer
 *
 * Handles multiple input formats:
 * - Native ArrayBuffer (passthrough)
 * - Serialized object format: {"0": byte, "1": byte, ...}
 * - Base64url encoded string
 */
export function arrayBufferFromObject(obj: any): ArrayBuffer {
  if (obj instanceof ArrayBuffer) {
    return obj;
  }

  // Handle serialized ArrayBuffer format: {"0": byte, "1": byte, ...}
  if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    // Check if it looks like a serialized ArrayBuffer (numeric keys)
    if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
      const bytes = Object.values(obj) as number[];
      const uint8Array = new Uint8Array(bytes);
      // Create a new ArrayBuffer and copy the data to ensure it's an ArrayBuffer, not SharedArrayBuffer
      const buffer = new ArrayBuffer(uint8Array.length);
      new Uint8Array(buffer).set(uint8Array);
      return buffer;
    }
  }

  // If it's a string, assume it's base64url encoded
  if (typeof obj === 'string') {
    const uint8Array = decodeBase64url(obj);
    const buffer = new ArrayBuffer(uint8Array.length);
    new Uint8Array(buffer).set(uint8Array);
    return buffer;
  }

  // If conversion fails, create empty buffer (will handle below)
  return new ArrayBuffer(0);
}

/**
 * Convert server-generated WebAuthn options to browser-compatible format
 *
 * Key transformations:
 * - Reconstructs ArrayBuffer from base64url challenge string
 * - Converts user.id from serialized to ArrayBuffer
 * - Processes excludeCredentials with proper ArrayBuffer IDs
 */
export function convertServerOptionsToWebAuthn(serverOptions: any, challengeString: string): PublicKeyCredentialCreationOptions {
  // Use the challenge string from the response root, not from options
  const challengeUint8Array = decodeBase64url(challengeString);
  const challengeBuffer = new ArrayBuffer(challengeUint8Array.length);
  new Uint8Array(challengeBuffer).set(challengeUint8Array);

  return {
    ...serverOptions,
    challenge: challengeBuffer,
    user: {
      ...serverOptions.user,
      id: arrayBufferFromObject(serverOptions.user.id),
    },
    excludeCredentials:
      serverOptions.excludeCredentials?.map((cred: any) => ({
        ...cred,
        id: arrayBufferFromObject(cred.id),
      })) || [],
  };
}

/**
 * Convert WebAuthn credential from browser to server-compatible format
 *
 * Transforms credential data from browser's binary ArrayBuffer format
 * into a JSON-serializable format suitable for server processing and
 * database storage.
 */
export function convertWebAuthnCredentialToStorage(credential: {
  id: string;
  rawId: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
    transports?: string[];
  };
  authenticatorAttachment?: string | null;
}): {
  id: string;
  rawId: ArrayBufferLike;
  response: {
    attestationObject: ArrayBufferLike;
    clientDataJSON: ArrayBufferLike;
    transports?: AuthenticatorTransport[];
  };
  type: 'public-key';
  authenticatorAttachment?: AuthenticatorAttachment | null;
} {
  // Convert base64url strings to ArrayBuffers
  const rawIdUint8Array = decodeBase64url(credential.rawId);
  const rawIdBuffer = new ArrayBuffer(rawIdUint8Array.length);
  new Uint8Array(rawIdBuffer).set(rawIdUint8Array);

  const attestationUint8Array = decodeBase64url(credential.response.attestationObject);
  const attestationBuffer = new ArrayBuffer(attestationUint8Array.length);
  new Uint8Array(attestationBuffer).set(attestationUint8Array);

  const clientDataUint8Array = decodeBase64url(credential.response.clientDataJSON);
  const clientDataBuffer = new ArrayBuffer(clientDataUint8Array.length);
  new Uint8Array(clientDataBuffer).set(clientDataUint8Array);

  return {
    id: credential.id,
    rawId: rawIdBuffer as ArrayBufferLike,
    response: {
      attestationObject: attestationBuffer as ArrayBufferLike,
      clientDataJSON: clientDataBuffer as ArrayBufferLike,
      transports: credential.response?.transports as AuthenticatorTransport[] | undefined,
    },
    type: 'public-key' as const,
    authenticatorAttachment: credential.authenticatorAttachment as AuthenticatorAttachment | null | undefined,
  };
}
