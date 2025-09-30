import type { DeviceInfo } from './@types/auth.types';

// WebAuthn Algorithm Constants
export const WEBAUTHN_ALGORITHMS = {
  ES256: -7,
  RS256: -257,
} as const;

// WebAuthn Configuration Constants
export const WEBAUTHN_CONFIG = {
  CHALLENGE_TIMEOUT: 60000, // 60 seconds
  CHALLENGE_SIZE: 32, // 32 bytes
  USER_ID_SIZE: 16, // 16 bytes
  COORDINATE_LENGTH: 32, // P-256 coordinates should be 32 bytes each
  HEX_COORDINATE_LENGTH: 64, // 32 bytes = 64 hex characters
} as const;

// Transport Methods
export const TRANSPORT_METHODS = {
  INTERNAL: 'internal',
  HYBRID: 'hybrid',
  USB: 'usb',
  NFC: 'nfc',
  BLE: 'ble',
  SMART_CARD: 'smart-card',
} as const;

// Attestation Types
export const ATTESTATION_TYPES = {
  NONE: 'none',
  BASIC: 'basic',
  SELF: 'self',
  ATTCA: 'attca',
  ECDAA: 'ecdaa',
} as const;

// Device Types
export const DEVICE_TYPES = {
  PLATFORM: 'platform',
  CROSS_PLATFORM: 'cross-platform',
} as const;

// Authenticator Flags (WebAuthn spec bit positions)
export const AUTHENTICATOR_FLAGS = {
  BACKUP_ELIGIBLE: 0x08, // BE flag (bit 3)
  BACKUP_STATE: 0x10, // BS flag (bit 4)
} as const;

// AAGUID to Device Information Registry
export const DEVICE_REGISTRY = new Map<string, DeviceInfo>([
  // YubiKey Series (Yubico)
  [
    'f8a011f3-8c0a-4d15-8006-17111f9edc7d',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'Yubico',
      model: 'YubiKey 5 Series',
      certified: true,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],
  [
    'cb69481e-8ff7-4039-93ec-0a2729a154a8',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'Yubico',
      model: 'YubiKey 5 FIPS Series',
      certified: true,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],
  [
    'ee882879-721c-4913-9775-3dfcce97072a',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'Yubico',
      model: 'YubiKey 4/5 U2F',
      certified: true,
      transports: [TRANSPORT_METHODS.USB],
    },
  ],
  [
    '2fc0579f-8113-47ea-b116-bb5a8db9202a',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'Yubico',
      model: 'YubiKey 5 Nano',
      certified: true,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],

  // Google Titan Keys
  [
    '0bb43545-fd2c-4185-87dd-feb0b2916ace',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'Google',
      model: 'Titan Security Key',
      certified: true,
      transports: [TRANSPORT_METHODS.USB],
    },
  ],
  [
    'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'Google',
      model: 'Titan Security Key NFC',
      certified: true,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],

  // SoloKeys
  [
    '8876631b-d4a0-427f-5773-0ec71c9e0279',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'SoloKeys',
      model: 'SoloKey',
      certified: false,
      transports: [TRANSPORT_METHODS.USB],
    },
  ],

  // Platform Authenticators
  [
    '08987058-cadc-4b81-b6e1-30de50dcbe96',
    {
      type: DEVICE_TYPES.PLATFORM,
      vendor: 'Microsoft',
      model: 'Windows Hello',
      certified: true,
      transports: [TRANSPORT_METHODS.INTERNAL, TRANSPORT_METHODS.HYBRID],
    },
  ],
  [
    'adce0002-35bc-c60a-648b-0b25f1f05503',
    {
      type: DEVICE_TYPES.PLATFORM,
      vendor: 'Microsoft',
      model: 'Windows Hello Hardware',
      certified: true,
      transports: [TRANSPORT_METHODS.INTERNAL, TRANSPORT_METHODS.HYBRID],
    },
  ],
  [
    '143c99b9-841c-4a4e-b0c9-b5ec1e8f7e0a',
    {
      type: DEVICE_TYPES.PLATFORM,
      vendor: 'Apple',
      model: 'Touch ID',
      certified: true,
      transports: [TRANSPORT_METHODS.INTERNAL, TRANSPORT_METHODS.HYBRID],
    },
  ],
  [
    '13a8c910-3f95-4fb7-a9e4-e2fd0d1c9c42',
    {
      type: DEVICE_TYPES.PLATFORM,
      vendor: 'Apple',
      model: 'Face ID',
      certified: true,
      transports: [TRANSPORT_METHODS.INTERNAL, TRANSPORT_METHODS.HYBRID],
    },
  ],
  [
    '0fc9b17c-8de4-4d6c-8d1b-4b73d0c82a7b',
    {
      type: DEVICE_TYPES.PLATFORM,
      vendor: 'Google',
      model: 'Android Platform',
      certified: true,
      transports: [TRANSPORT_METHODS.INTERNAL, TRANSPORT_METHODS.HYBRID],
    },
  ],

  // FEITIAN Keys
  [
    '77010bd7-212a-4fc9-b236-d2ca5e9d4084',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'FEITIAN',
      model: 'ePass FIDO',
      certified: true,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],

  // TrustKey Solutions
  [
    'a4e9fc6d-4cbe-4758-b8ba-37598bb5bbaa',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'TrustKey',
      model: 'Security Key',
      certified: true,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],

  // HyperFIDO
  [
    'e1a96183-5016-4f24-b55b-e3ae23614cc6',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'HyperFIDO',
      model: 'Security Key',
      certified: false,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],

  // Neowave Keydo
  [
    '8c97a730-3f7b-41a6-87d6-1e9b62bda6e0',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'Neowave',
      model: 'Keydo FIDO2',
      certified: true,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],

  // AuthenTrend
  [
    '0ea242b4-43c4-4a1b-8c17-de77743cbf9d',
    {
      type: DEVICE_TYPES.CROSS_PLATFORM,
      vendor: 'AuthenTrend',
      model: 'ATKey',
      certified: true,
      transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC],
    },
  ],
]);

// Default Device Info for Unknown Devices
export const DEFAULT_DEVICE_INFO: Record<'platform' | 'cross-platform', DeviceInfo> = {
  platform: {
    type: DEVICE_TYPES.PLATFORM,
    vendor: 'Unknown',
    model: 'Platform Authenticator',
    certified: false,
    transports: [TRANSPORT_METHODS.INTERNAL, TRANSPORT_METHODS.HYBRID],
  },
  'cross-platform': {
    type: DEVICE_TYPES.CROSS_PLATFORM,
    vendor: 'Unknown',
    model: 'Security Key',
    certified: false,
    transports: [TRANSPORT_METHODS.USB, TRANSPORT_METHODS.NFC, TRANSPORT_METHODS.HYBRID],
  },
} as const;

// Attestation Format to Type Mapping using Command Pattern
type AttestationFormatHandler = (attStmt: any) => string;

export const ATTESTATION_FORMAT_HANDLERS = new Map<string, AttestationFormatHandler>([
  ['none', () => ATTESTATION_TYPES.NONE],
  [
    'packed',
    attStmt => {
      if (attStmt.x5c && attStmt.x5c.length > 0) {
        return ATTESTATION_TYPES.BASIC;
      }
      if (attStmt.sig && !attStmt.x5c) {
        return ATTESTATION_TYPES.SELF;
      }
      return ATTESTATION_TYPES.NONE;
    },
  ],
  [
    'fido-u2f',
    attStmt => {
      if (attStmt.x5c && attStmt.x5c.length > 0) {
        return ATTESTATION_TYPES.BASIC;
      }
      return ATTESTATION_TYPES.SELF;
    },
  ],
  ['android-key', () => ATTESTATION_TYPES.BASIC],
  ['android-safetynet', () => ATTESTATION_TYPES.ATTCA],
  ['tpm', () => ATTESTATION_TYPES.BASIC],
  ['apple', () => ATTESTATION_TYPES.BASIC],
]);

export enum WebAuthnErrorCode {
  INVALID_CHALLENGE = 'INVALID_CHALLENGE',
  INVALID_ORIGIN = 'INVALID_ORIGIN',
  INVALID_RPID = 'INVALID_RPID',
  USER_NOT_PRESENT = 'USER_NOT_PRESENT',
  INVALID_COUNTER = 'INVALID_COUNTER',
  SIGNATURE_FAILED = 'SIGNATURE_FAILED',
  UNSUPPORTED_ALGORITHM = 'UNSUPPORTED_ALGORITHM',
  INVALID_CREDENTIAL = 'INVALID_CREDENTIAL',
  CHALLENGE_EXPIRED = 'CHALLENGE_EXPIRED',
  INVALID_KEY_FORMAT = 'INVALID_KEY_FORMAT',
  DEFAULT = 'DEFAULT',
}

// Error Message Resolver Type
type ErrorMessageResolver = (operation: 'registration' | 'authentication') => string;

// WebAuthn Error Messages using Command Pattern
export const WEBAUTHN_ERROR_MESSAGES = new Map<WebAuthnErrorCode, ErrorMessageResolver>([
  [WebAuthnErrorCode.CHALLENGE_EXPIRED, () => 'Session expired. Please refresh the page and try again.'],
  [WebAuthnErrorCode.INVALID_CHALLENGE, () => 'Security check failed. Please refresh the page and try again.'],
  [WebAuthnErrorCode.INVALID_COUNTER, () => 'Security violation detected. Your authenticator may be compromised. Please contact support immediately.'],
  [WebAuthnErrorCode.INVALID_KEY_FORMAT, () => 'Invalid security key format. Please re-register your device.'],
  [WebAuthnErrorCode.INVALID_ORIGIN, () => 'Request origin not recognized. Please ensure you are on the correct website.'],
  [WebAuthnErrorCode.INVALID_RPID, () => 'Security configuration error. Please contact support.'],
  [WebAuthnErrorCode.UNSUPPORTED_ALGORITHM, () => 'Your authenticator uses an unsupported security algorithm. Please use a different device.'],
  [WebAuthnErrorCode.USER_NOT_PRESENT, () => 'User presence verification failed. Please interact with your authenticator when prompted.'],
  [WebAuthnErrorCode.INVALID_CREDENTIAL, operation => (operation === 'registration' ? 'Failed to create credential. Please try again.' : 'Authenticator not recognized. Please use the device you registered with.')],
  [
    WebAuthnErrorCode.SIGNATURE_FAILED,
    operation => (operation === 'registration' ? 'Failed to verify authenticator. Please try a different device.' : 'Authentication failed. Please verify you are using the correct authenticator.'),
  ],
  [WebAuthnErrorCode.DEFAULT, operation => (operation === 'registration' ? 'Registration failed. Please try again.' : 'Authentication failed. Please try again.')],
]);

// Utility Functions
export function convertAAGUIDToUUID(aaguid: Uint8Array): string {
  const aaguidString = Array.from(aaguid)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return [aaguidString.slice(0, 8), aaguidString.slice(8, 12), aaguidString.slice(12, 16), aaguidString.slice(16, 20), aaguidString.slice(20, 32)].join('-');
}

export function isAAGUIDAllZeros(aaguid: Uint8Array): boolean {
  return Array.from(aaguid).every(byte => byte === 0);
}
