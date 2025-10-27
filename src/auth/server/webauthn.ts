import { decodePKIXECDSASignature, ECDSAPublicKey, p256, verifyECDSASignature } from '@oslojs/crypto/ecdsa';
import { sha256 } from '@oslojs/crypto/sha2';
import { decodeBase64url, encodeBase64url } from '@oslojs/encoding';
import { ClientDataType, COSEKeyType, createAssertionSignatureMessage, parseAttestationObject, parseAuthenticatorData, parseClientDataJSON } from '@oslojs/webauthn';
import { logger } from '@ycore/forge/logger';
import { err, type Result } from '@ycore/forge/result';

import type { DeviceInfo, EnhancedDeviceInfo, WebAuthnAuthenticationData, WebAuthnRegistrationData } from '../@types/auth.types';
import {
  ATTESTATION_FORMAT_HANDLERS,
  ATTESTATION_TYPES,
  AUTHENTICATOR_FLAGS,
  convertAAGUIDToUUID,
  DEFAULT_DEVICE_INFO,
  isAAGUIDAllZeros,
  WEBAUTHN_ALGORITHMS,
  WEBAUTHN_CONFIG,
  WEBAUTHN_ERROR_MESSAGES,
  WebAuthnErrorCode,
} from '../auth.constants';
import type { Authenticator as AuthenticatorModel } from '../schema';

/**
 * Helper function to convert Uint8Array to ArrayBuffer
 * This ensures we get a proper ArrayBuffer instead of SharedArrayBuffer
 */
function toArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(buffer).set(uint8Array);
  return buffer;
}

/**
 * Extract backup state from authenticator data flags
 */
function extractBackupState(authenticatorData: any): { isBackupEligible: boolean; isBackedUp: boolean } {
  const flags = authenticatorData.flags || 0;

  const isBackupEligible = (flags & AUTHENTICATOR_FLAGS.BACKUP_ELIGIBLE) !== 0;
  const isBackedUp = (flags & AUTHENTICATOR_FLAGS.BACKUP_STATE) !== 0;

  return { isBackupEligible, isBackedUp };
}

/**
 * Extract transport methods based on device characteristics
 */
function extractTransportMethods(deviceInfo: DeviceInfo): string[] {
  return [...deviceInfo.transports];
}

/**
 * Extract attestation type from attestation object using command pattern
 */
function extractAttestationType(attestationObject: any): string {
  try {
    const fmt = attestationObject.fmt;
    const attStmt = attestationObject.attStmt;

    const handler = ATTESTATION_FORMAT_HANDLERS.get(fmt);
    if (handler) {
      return handler(attStmt);
    }

    logger.warning('webauthn_unknown_attestation_format', { format: fmt });
    return ATTESTATION_TYPES.NONE;
  } catch (error) {
    logger.error('webauthn_attestation_extraction_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return ATTESTATION_TYPES.NONE;
  }
}

/**
 * Generate a default friendly name for an authenticator
 */
function generateDefaultAuthenticatorName(deviceInfo: DeviceInfo): string {
  // If we have specific vendor/model info, use it
  if (deviceInfo.vendor !== 'Unknown' && deviceInfo.model !== 'Security Key' && deviceInfo.model !== 'Device') {
    return `${deviceInfo.vendor} ${deviceInfo.model}`;
  }

  // Fall back to generic names with timestamp
  const deviceType = deviceInfo.type === 'platform' ? 'Biometric Device' : 'Security Key';
  const timestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${deviceType} (${timestamp})`;
}

/**
 * Get comprehensive device information by AAGUID with KV lookup and fallback
 */
async function getDeviceInfoByAAGUID(aaguid: Uint8Array, metadataKV?: KVNamespace): Promise<DeviceInfo> {
  // If AAGUID is all zeros, it's likely a platform authenticator
  if (isAAGUIDAllZeros(aaguid)) {
    return DEFAULT_DEVICE_INFO.platform;
  }

  const uuid = convertAAGUIDToUUID(aaguid);

  // Try KV lookup first (MDS data)
  if (metadataKV) {
    try {
      const mdsData = await metadataKV.get(`device:${uuid}`, 'json');
      if (mdsData) {
        logger.debug('device_info_mds_hit', { uuid });
        return mdsData as EnhancedDeviceInfo;
      }
    } catch (error) {
      logger.warning('device_info_kv_lookup_failed', {
        uuid,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  // Fallback to default
  logger.debug('device_info_fallback', { uuid });
  return DEFAULT_DEVICE_INFO['cross-platform'];
}

export function getWebAuthnErrorMessage(code: WebAuthnErrorCode | undefined, operation: 'registration' | 'authentication'): string {
  if (!code) {
    return WEBAUTHN_ERROR_MESSAGES.get(WebAuthnErrorCode.DEFAULT)?.(operation) || 'Auth failure. Please try again.';
  }

  const messageResolver = WEBAUTHN_ERROR_MESSAGES.get(code);
  return messageResolver ? messageResolver(operation) : WEBAUTHN_ERROR_MESSAGES.get(WebAuthnErrorCode.DEFAULT)?.(operation) || 'Auth failure. Please try again.';
}

/**
 * Generate a cryptographically secure challenge
 */
export function generateChallenge(): string {
  const bytes = new Uint8Array(WEBAUTHN_CONFIG.CHALLENGE_SIZE);
  crypto.getRandomValues(bytes);
  return encodeBase64url(bytes);
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  const bytes = new Uint8Array(WEBAUTHN_CONFIG.USER_ID_SIZE);
  crypto.getRandomValues(bytes);
  return encodeBase64url(bytes);
}

/**
 * Create WebAuthn registration options
 */
export function createRegistrationOptions(
  rpName: string,
  rpId: string,
  userName: string,
  userDisplayName: string,
  challenge: string,
  excludeCredentials: Array<{ id: string; transports?: AuthenticatorTransport[] }> = []
): PublicKeyCredentialCreationOptions {
  return {
    challenge: toArrayBuffer(decodeBase64url(challenge)),
    rp: {
      name: rpName,
      id: rpId,
    },
    user: {
      id: toArrayBuffer(decodeBase64url(generateUserId())),
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { alg: WEBAUTHN_ALGORITHMS.ES256, type: 'public-key' },
      { alg: WEBAUTHN_ALGORITHMS.RS256, type: 'public-key' },
    ],
    timeout: WEBAUTHN_CONFIG.CHALLENGE_TIMEOUT,
    attestation: 'none',
    excludeCredentials: excludeCredentials.map(cred => ({
      id: toArrayBuffer(decodeBase64url(cred.id)),
      type: 'public-key' as PublicKeyCredentialType,
      // Use actual transports if available, otherwise omit (let browser decide)
      ...(cred.transports && cred.transports.length > 0 ? { transports: cred.transports } : {}),
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
export function createAuthenticationOptions(rpId: string, challenge: string, allowCredentials: Array<{ id: string; transports?: AuthenticatorTransport[] }> = []): PublicKeyCredentialRequestOptions {
  return {
    challenge: toArrayBuffer(decodeBase64url(challenge)),
    rpId,
    timeout: WEBAUTHN_CONFIG.CHALLENGE_TIMEOUT,
    userVerification: 'preferred',
    allowCredentials:
      allowCredentials.length > 0
        ? allowCredentials.map(cred => ({
            id: toArrayBuffer(decodeBase64url(cred.id)),
            type: 'public-key' as PublicKeyCredentialType,
            // Use actual transports if available, otherwise omit (let browser decide)
            ...(cred.transports && cred.transports.length > 0 ? { transports: cred.transports } : {}),
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
  expectedRPID: string,
  metadataKV?: KVNamespace
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

    // Verify it's using ES256 algorithm
    const publicKeyAlgorithm = publicKey.algorithm();
    if (publicKeyAlgorithm !== WEBAUTHN_ALGORITHMS.ES256) {
      return err('Only ES256 algorithm is supported', {
        field: 'algorithm',
        code: WebAuthnErrorCode.UNSUPPORTED_ALGORITHM,
      });
    }

    // Store the public key's decoded object as JSON (we'll reconstruct it during verification)
    // This approach maintains the complete COSE key structure
    const credentialPublicKey = encodeBase64url(new TextEncoder().encode(JSON.stringify(attestedCredential.publicKey.decoded)));

    // Use actual transports from the credential if available, otherwise fall back to device info
    let transports: string[] = [];
    if (credential.response.transports && credential.response.transports.length > 0) {
      // Use the actual transports reported by the authenticator
      transports = credential.response.transports;
      logger.debug('webauthn_using_actual_transports', { transports });
    } else {
      // Fall back to device info based on AAGUID
      const deviceInfo = await getDeviceInfoByAAGUID(attestedCredential.authenticatorAAGUID, metadataKV);
      transports = extractTransportMethods(deviceInfo);
      logger.debug('webauthn_using_fallback_transports', { transports, source: 'deviceInfo' });
    }

    // Determine device type from authenticatorAttachment if available
    let credentialDeviceType: 'platform' | 'cross-platform' = 'cross-platform';
    if (credential.authenticatorAttachment) {
      credentialDeviceType = credential.authenticatorAttachment === 'platform' ? 'platform' : 'cross-platform';
      logger.debug('webauthn_device_type_from_attachment', {
        authenticatorAttachment: credential.authenticatorAttachment,
        credentialDeviceType,
      });
    } else {
      // Fall back to AAGUID-based detection
      const deviceInfo = await getDeviceInfoByAAGUID(attestedCredential.authenticatorAAGUID, metadataKV);
      credentialDeviceType = deviceInfo.type;
      logger.debug('webauthn_device_type_from_aaguid', {
        aaguid: encodeBase64url(attestedCredential.authenticatorAAGUID),
        credentialDeviceType,
      });
    }

    // Get device info for generating a friendly name
    const deviceInfo = await getDeviceInfoByAAGUID(attestedCredential.authenticatorAAGUID, metadataKV);

    // Extract backup state from authenticator flags
    const backupState = extractBackupState(authenticatorData);

    // Get algorithm from public key
    const keyAlgorithm = attestedCredential.publicKey.algorithm();

    // Extract attestation type from attestation object
    const attestationType = extractAttestationType(attestationObject);

    // Generate a default friendly name based on device info
    const defaultName = generateDefaultAuthenticatorName(deviceInfo);

    return {
      id: encodeBase64url(attestedCredential.id),
      credentialPublicKey,
      counter: authenticatorData.signatureCounter,
      credentialDeviceType,
      credentialBackedUp: backupState.isBackedUp,
      transports,
      aaguid: encodeBase64url(attestedCredential.authenticatorAAGUID),
      name: defaultName,
      lastUsedAt: null,
      attestationType,
      rpId: expectedRPID,
      algorithm: keyAlgorithm,
    };
  } catch (error) {
    logger.error('webauthn_registration_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return err('Registration verification failed', { field: 'general' }, { status: 500 });
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

    // Create assertion message for signature verification using Oslo.js utility
    const signatureMessage = createAssertionSignatureMessage(new Uint8Array(credential.response.authenticatorData), new Uint8Array(credential.response.clientDataJSON));

    // Reconstruct the COSE key from stored JSON
    let publicKeyData: any;
    try {
      // Decode the stored COSE key JSON
      const storedKeyJson = new TextDecoder().decode(decodeBase64url(storedCredential.credentialPublicKey));
      publicKeyData = JSON.parse(storedKeyJson);

      if (!publicKeyData) {
        return err(
          'Invalid stored public key',
          {
            field: 'publicKey',
            code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
          },
          { status: 500 }
        ); // System error - corrupted data in DB
      }
    } catch (error) {
      logger.error('webauthn_authentication_key_parse_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return err(
        'Failed to parse stored public key',
        {
          field: 'publicKey',
          code: WebAuthnErrorCode.INVALID_KEY_FORMAT,
        },
        { status: 500 }
      ); // System error - corrupted data in DB
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
      if (xBytes.length !== WEBAUTHN_CONFIG.COORDINATE_LENGTH || yBytes.length !== WEBAUTHN_CONFIG.COORDINATE_LENGTH) {
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
      const xHexPadded = xHex.padStart(WEBAUTHN_CONFIG.HEX_COORDINATE_LENGTH, '0');
      const yHexPadded = yHex.padStart(WEBAUTHN_CONFIG.HEX_COORDINATE_LENGTH, '0');

      const xBigInt = BigInt(`0x${xHexPadded}`);
      const yBigInt = BigInt(`0x${yHexPadded}`);

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
      const isValid = verifyECDSASignature(publicKey, messageHash, signature);

      if (!isValid) {
        return err('Invalid signature', {
          field: 'signature',
          code: WebAuthnErrorCode.SIGNATURE_FAILED,
        });
      }
    } catch (error) {
      logger.error('webauthn_authentication_signature_verification_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        credentialId: credential.id,
      });
      return err(
        'Signature verification failed',
        {
          field: 'signature',
          code: WebAuthnErrorCode.SIGNATURE_FAILED,
        },
        { status: 500 }
      ); // System error - crypto operation failed
    }

    return {
      verified: true,
      newCounter: authenticatorData.signatureCounter,
    };
  } catch (error) {
    logger.error('webauthn_authentication_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return err('Authentication verification failed', { field: 'general' }, { status: 500 });
  }
}
