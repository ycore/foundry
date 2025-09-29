import { decodePKIXECDSASignature, ECDSAPublicKey, p256, verifyECDSASignature } from '@oslojs/crypto/ecdsa';
import { sha256 } from '@oslojs/crypto/sha2';
import { decodeBase64url, encodeBase64url } from '@oslojs/encoding';
import { ClientDataType, COSEKeyType, parseAttestationObject, parseAuthenticatorData, parseClientDataJSON } from '@oslojs/webauthn';
import { logger } from '@ycore/forge/logger';
import { err, type Result } from '@ycore/forge/result';

import type { WebAuthnAuthenticationData, WebAuthnRegistrationData } from '../@types/auth.types';
import { WebAuthnErrorCode } from '../@types/auth.types';
import type { Authenticator as AuthenticatorModel } from '../schema';

type ErrorMessageResolver = (operation: 'registration' | 'authentication') => string;

// Command pattern using Map for WebAuthn error messages
const webauthnErrorMessages = new Map<WebAuthnErrorCode, ErrorMessageResolver>([
  [WebAuthnErrorCode.CHALLENGE_EXPIRED, () => 'Session expired. Please refresh the page and try again.'],
  [WebAuthnErrorCode.INVALID_CHALLENGE, () => 'Security check failed. Please refresh the page and try again.'],
  [WebAuthnErrorCode.INVALID_COUNTER, () => 'Security violation detected. Your authenticator may be compromised. Please contact support immediately.'],
  [WebAuthnErrorCode.INVALID_KEY_FORMAT, () => 'Invalid security key format. Please re-register your device.'],
  [WebAuthnErrorCode.INVALID_ORIGIN, () => 'Request origin not recognized. Please ensure you are on the correct website.'],
  [WebAuthnErrorCode.INVALID_RPID, () => 'Security configuration error. Please contact support.'],
  [WebAuthnErrorCode.UNSUPPORTED_ALGORITHM, () => 'Your authenticator uses an unsupported security algorithm. Please use a different device.'],
  [WebAuthnErrorCode.USER_NOT_PRESENT, () => 'User presence verification failed. Please interact with your authenticator when prompted.'],
  [WebAuthnErrorCode.INVALID_CREDENTIAL, (operation) =>
    operation === 'registration'
      ? 'Failed to create credential. Please try again.'
      : 'Authenticator not recognized. Please use the device you registered with.'],
  [WebAuthnErrorCode.SIGNATURE_FAILED, (operation) =>
    operation === 'registration'
      ? 'Failed to verify authenticator. Please try a different device.'
      : 'Authentication failed. Please verify you are using the correct authenticator.'],
  [WebAuthnErrorCode.DEFAULT, (operation) =>
    operation === 'registration'
      ? 'Registration failed. Please try again.'
      : 'Authentication failed. Please try again.'],
]);

export function getWebAuthnErrorMessage(code: WebAuthnErrorCode | undefined, operation: 'registration' | 'authentication'): string {
  if (!code) {
    return webauthnErrorMessages.get(WebAuthnErrorCode.DEFAULT)?.(operation) || 'Auth failure. Please try again.';
  }

  const messageResolver = webauthnErrorMessages.get(code);
  return messageResolver ? messageResolver(operation) : webauthnErrorMessages.get(WebAuthnErrorCode.DEFAULT)?.(operation) || 'Auth failure. Please try again.';
}

/**
 * Generate a cryptographically secure challenge
 */
export function generateChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase64url(bytes);
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return encodeBase64url(bytes);
}

/**
 * Create WebAuthn registration options
 */
export function createRegistrationOptions(rpName: string, rpId: string, userName: string, userDisplayName: string, challenge: string, excludeCredentials: string[] = []): PublicKeyCredentialCreationOptions {
  return {
    challenge: decodeBase64url(challenge),
    rp: {
      name: rpName,
      id: rpId,
    },
    user: {
      id: decodeBase64url(generateUserId()),
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    excludeCredentials: excludeCredentials.map(id => ({
      id: decodeBase64url(id),
      type: 'public-key' as PublicKeyCredentialType,
      transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: 'discouraged',
      requireResidentKey: false,
      userVerification: 'preferred',
    },
  };
}

/**
 * Create WebAuthn authentication options
 */
export function createAuthenticationOptions(rpId: string, challenge: string, allowCredentials: string[] = []): PublicKeyCredentialRequestOptions {
  return {
    challenge: decodeBase64url(challenge),
    rpId,
    timeout: 60000,
    userVerification: 'preferred',
    allowCredentials:
      allowCredentials.length > 0
        ? allowCredentials.map(id => ({
          id: decodeBase64url(id),
          type: 'public-key' as PublicKeyCredentialType,
          transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
        }))
        : [],
  };
}

/**
 * Verify registration response using Oslo WebAuthn
 */
export async function verifyRegistration(
  credential: WebAuthnRegistrationData,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string
): Promise<Result<Omit<AuthenticatorModel, 'userId' | 'createdAt' | 'updatedAt'>>> {
  try {
    // Parse attestation object
    const attestationObject = await parseAttestationObject(new Uint8Array(credential.response.attestationObject));
    const { authenticatorData } = attestationObject;

    // Parse client data
    const clientData = parseClientDataJSON(new Uint8Array(credential.response.clientDataJSON));

    // Verify challenge - convert Uint8Array to base64url for comparison
    const receivedChallenge = encodeBase64url(new Uint8Array(clientData.challenge));
    if (receivedChallenge !== expectedChallenge) {
      return err('Invalid challenge', {
        field: 'challenge',
        code: WebAuthnErrorCode.INVALID_CHALLENGE,
      });
    }

    // Verify origin
    if (clientData.origin !== expectedOrigin) {
      return err('Invalid origin', {
        field: 'origin',
        code: WebAuthnErrorCode.INVALID_ORIGIN,
      });
    }

    // Verify type
    if (clientData.type !== ClientDataType.Create) {
      return err('Invalid request type', {
        field: 'type',
        code: WebAuthnErrorCode.INVALID_CREDENTIAL,
      });
    }

    // Verify RP ID hash
    if (!authenticatorData.verifyRelyingPartyIdHash(expectedRPID)) {
      return err('Invalid relying party', {
        field: 'rpId',
        code: WebAuthnErrorCode.INVALID_RPID,
      });
    }

    // Verify user presence
    if (!authenticatorData.userPresent) {
      return err('User presence required', {
        field: 'userPresence',
        code: WebAuthnErrorCode.USER_NOT_PRESENT,
      });
    }

    // Extract credential
    const attestedCredential = authenticatorData.credential;
    if (!attestedCredential) {
      return err('No credential found', {
        field: 'credential',
        code: WebAuthnErrorCode.INVALID_CREDENTIAL,
      });
    }

    // Verify supported algorithm - we only support ES256 (ECDSA with P-256)
    const publicKey = attestedCredential.publicKey;
    if (publicKey.type() !== COSEKeyType.EC2) {
      return err('Only ES256 algorithm is supported', {
        field: 'keyType',
        code: WebAuthnErrorCode.UNSUPPORTED_ALGORITHM,
      });
    }

    // Verify it's using ES256 algorithm (-7)
    const algorithm = publicKey.algorithm();
    const ES256_ALGORITHM_ID = -7; // ES256 (ECDSA with P-256 and SHA-256)
    if (algorithm !== ES256_ALGORITHM_ID) {
      return err('Only ES256 algorithm is supported', {
        field: 'algorithm',
        code: WebAuthnErrorCode.UNSUPPORTED_ALGORITHM,
      });
    }

    // Store the public key's decoded object as JSON (we'll reconstruct it during verification)
    // This approach maintains the complete COSE key structure
    const credentialPublicKey = encodeBase64url(new TextEncoder().encode(JSON.stringify(attestedCredential.publicKey.decoded)));

    return {
      id: encodeBase64url(attestedCredential.id),
      credentialPublicKey,
      counter: authenticatorData.signatureCounter,
      credentialDeviceType: 'platform',
      credentialBackedUp: true, // Assume backed up for platform authenticators
      transports: 'internal,hybrid',
      aaguid: encodeBase64url(attestedCredential.authenticatorAAGUID),
    };
  } catch (error) {
    logger.error('webauthn_registration_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return err('Registration verification failed', { field: 'general' });
  }
}

/**
 * Verify authentication response using Oslo WebAuthn
 */
export async function verifyAuthentication(
  credential: WebAuthnAuthenticationData,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string,
  storedCredential: AuthenticatorModel
): Promise<Result<{ verified: boolean; newCounter: number }>> {
  try {
    // Parse authenticator data
    const authenticatorData = parseAuthenticatorData(new Uint8Array(credential.response.authenticatorData));

    // Parse client data
    const clientData = parseClientDataJSON(new Uint8Array(credential.response.clientDataJSON));

    // Verify challenge - convert Uint8Array to base64url for comparison
    const receivedChallenge = encodeBase64url(new Uint8Array(clientData.challenge));
    if (receivedChallenge !== expectedChallenge) {
      return err('Invalid challenge', {
        field: 'challenge',
        code: WebAuthnErrorCode.INVALID_CHALLENGE,
      });
    }

    // Verify origin
    if (clientData.origin !== expectedOrigin) {
      return err('Invalid origin', {
        field: 'origin',
        code: WebAuthnErrorCode.INVALID_ORIGIN,
      });
    }

    // Verify type
    if (clientData.type !== ClientDataType.Get) {
      return err('Invalid request type', {
        field: 'type',
        code: WebAuthnErrorCode.INVALID_CREDENTIAL,
      });
    }

    // Verify RP ID hash
    if (!authenticatorData.verifyRelyingPartyIdHash(expectedRPID)) {
      return err('Invalid relying party', {
        field: 'rpId',
        code: WebAuthnErrorCode.INVALID_RPID,
      });
    }

    // Verify user presence
    if (!authenticatorData.userPresent) {
      return err('User presence required', {
        field: 'userPresence',
        code: WebAuthnErrorCode.USER_NOT_PRESENT,
      });
    }

    // Verify counter BEFORE signature verification (prevent replay attacks)
    // If counter is greater than 0, it must be strictly greater than stored counter
    if (storedCredential.counter > 0 || authenticatorData.signatureCounter > 0) {
      if (authenticatorData.signatureCounter <= storedCredential.counter) {
        logger.critical('webauthn_authentication_counter_rollback_detected', {
          stored: storedCredential.counter,
          received: authenticatorData.signatureCounter,
          credentialId: credential.id,
          userId: storedCredential.userId,
        });
        return err('Security violation: Counter rollback detected', {
          field: 'counter',
          code: WebAuthnErrorCode.INVALID_COUNTER,
        });
      }
    }

    // Create assertion message for signature verification
    const clientDataHash = sha256(new Uint8Array(credential.response.clientDataJSON));
    // We need the raw authenticator data bytes, so we'll recreate from the original response
    const authenticatorDataBytes = new Uint8Array(credential.response.authenticatorData);

    // Use direct concatenation instead of Oslo's createAssertionSignatureMessage
    // WebAuthn spec: signatureMessage = authenticatorData || hash(clientDataJSON)
    const signatureMessage = new Uint8Array(authenticatorDataBytes.length + clientDataHash.length);
    signatureMessage.set(authenticatorDataBytes, 0);
    signatureMessage.set(clientDataHash, authenticatorDataBytes.length);

    // Message construction complete

    // Reconstruct the COSE key from stored JSON
    let publicKeyData: any;
    try {
      // Decode the stored COSE key JSON
      const storedKeyJson = new TextDecoder().decode(decodeBase64url(storedCredential.credentialPublicKey));
      publicKeyData = JSON.parse(storedKeyJson);

      if (!publicKeyData) {
        return err('Invalid stored public key', {
          field: 'publicKey',
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
        });
      }
    } catch (error) {
      logger.error('webauthn_authentication_key_parse_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return err('Failed to parse stored public key', {
        field: 'publicKey',
        code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
      });
    }

    // Verify the signature using ECDSA with P-256
    try {
      const signatureBytes = new Uint8Array(credential.response.signature);

      // Extract EC2 key components for ES256 (algorithm -7)
      // COSE key type 2 (EC2) with curve P-256 (1)
      // Note: COSE uses negative integers as key labels: -2 for x, -3 for y

      // Parse COSE key structure

      const xCoordinate = publicKeyData[-2]; // x coordinate in COSE key
      const yCoordinate = publicKeyData[-3]; // y coordinate in COSE key

      if (!xCoordinate || !yCoordinate) {
        return err('Invalid public key structure', {
          field: 'publicKey',
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
        });
      }

      // Convert coordinates to Uint8Array
      let xBytes: Uint8Array;
      let yBytes: Uint8Array;

      try {
        if (typeof xCoordinate === 'string') {
          xBytes = decodeBase64url(xCoordinate);
        } else if (Array.isArray(xCoordinate)) {
          xBytes = new Uint8Array(xCoordinate);
        } else if (typeof xCoordinate === 'object' && xCoordinate !== null) {
          // Handle object format like {"0":179,"1":124,...}
          const values = Object.values(xCoordinate) as number[];
          xBytes = new Uint8Array(values);
        } else {
          xBytes = new Uint8Array(xCoordinate);
        }

        if (typeof yCoordinate === 'string') {
          yBytes = decodeBase64url(yCoordinate);
        } else if (Array.isArray(yCoordinate)) {
          yBytes = new Uint8Array(yCoordinate);
        } else if (typeof yCoordinate === 'object' && yCoordinate !== null) {
          // Handle object format like {"0":179,"1":124,...}
          const values = Object.values(yCoordinate) as number[];
          yBytes = new Uint8Array(values);
        } else {
          yBytes = new Uint8Array(yCoordinate);
        }
      } catch (error) {
        logger.error('webauthn_authentication_coordinate_decode_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return err('Failed to decode key coordinates', {
          field: 'publicKey',
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
        });
      }

      // Validate coordinate lengths (P-256 coordinates should be 32 bytes each)
      if (xBytes.length !== 32 || yBytes.length !== 32) {
        return err('Invalid coordinate length for P-256 key', {
          field: 'publicKey',
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
        });
      }

      // Convert bytes to bigint for ECDSAPublicKey constructor
      const xHex = Array.from(xBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const yHex = Array.from(yBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (xHex.length === 0 || yHex.length === 0) {
        return err('Empty coordinate data', {
          field: 'publicKey',
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
        });
      }

      // Ensure coordinates are exactly 64 hex characters (32 bytes)
      const xHexPadded = xHex.padStart(64, '0');
      const yHexPadded = yHex.padStart(64, '0');

      const xBigInt = BigInt('0x' + xHexPadded);
      const yBigInt = BigInt('0x' + yHexPadded);

      // Convert coordinates for ECDSAPublicKey constructor

      // Create public key using ECDSAPublicKey constructor with P-256 curve
      const publicKey = new ECDSAPublicKey(p256, xBigInt, yBigInt);

      // Validate that the public key is on the P-256 curve
      if (!publicKey.isCurve(p256)) {
        return err('Public key not on P-256 curve', {
          field: 'publicKey',
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
        });
      }

      // Additional validation: try encoding the public key to SEC1 format to verify it's valid
      try {
        publicKey.encodeSEC1Uncompressed();
      } catch (error) {
        logger.error('webauthn_authentication_public_key_encoding_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return err('Invalid public key encoding', {
          field: 'publicKey',
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
        });
      }

      const messageHash = sha256(signatureMessage);

      // WebAuthn signatures are DER-encoded, we need to decode them first
      const signature = decodePKIXECDSASignature(signatureBytes);

      // Try verification with Oslo library
      const isValidOslo = verifyECDSASignature(publicKey, messageHash, signature);

      // Also try verification with Web Crypto API for comparison
      let isValidWebCrypto = false;
      try {
        // Create a CryptoKey from the public key coordinates
        const publicKeyJWK = {
          kty: 'EC',
          crv: 'P-256',
          x: btoa(String.fromCharCode(...xBytes))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, ''),
          y: btoa(String.fromCharCode(...yBytes))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, ''),
        };

        const cryptoKey = await crypto.subtle.importKey('jwk', publicKeyJWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);

        // Convert signature from r,s components to DER format for WebCrypto
        isValidWebCrypto = await crypto.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          cryptoKey,
          signatureBytes, // Use original DER-encoded signature
          signatureMessage
        );

        // Try alternative message construction as fallback
        if (!isValidWebCrypto) {
          const rawAuthenticatorData = new Uint8Array(credential.response.authenticatorData);
          const alternativeMessage = new Uint8Array(rawAuthenticatorData.length + 32);
          alternativeMessage.set(rawAuthenticatorData, 0);
          alternativeMessage.set(clientDataHash, rawAuthenticatorData.length);

          const isValidAlternative = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, signatureBytes, alternativeMessage);
          isValidWebCrypto = isValidAlternative;
        }
      } catch (error) {
        logger.error('webauthn_authentication_webcrypto_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      const isValid = isValidOslo || isValidWebCrypto;

      if (!isValid) {
        return err('Invalid signature', {
          field: 'signature',
          code: WebAuthnErrorCode.SIGNATURE_FAILED,
        });
      }

      logger.info('webauthn_authentication_signature_verified', {
        credentialId: credential.id,
      });
    } catch (error) {
      logger.error('webauthn_authentication_signature_verification_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        credentialId: credential.id,
      });
      return err('Signature verification failed', {
        field: 'signature',
        code: WebAuthnErrorCode.SIGNATURE_FAILED,
      });
    }

    logger.info('webauthn_authentication_verified', {
      credentialId: credential.id,
      userVerified: authenticatorData.userVerified,
      newCounter: authenticatorData.signatureCounter,
    });

    return {
      verified: true,
      newCounter: authenticatorData.signatureCounter,
    };
  } catch (error) {
    logger.error('webauthn_authentication_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return err('Authentication verification failed', { field: 'general' });
  }
}
