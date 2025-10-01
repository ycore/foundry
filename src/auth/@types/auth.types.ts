import type { PublicKeyCredentialDescriptorJSON } from '@simplewebauthn/types';
import type { RouterContextProvider, SessionStorage } from 'react-router';
import type { Authenticator, User } from '../schema';

export interface DeviceInfo {
  type: 'platform' | 'cross-platform';
  vendor: string;
  model: string;
  certified: boolean;
  transports: string[];
}

export interface EnhancedDeviceInfo extends DeviceInfo {
  certificationStatus?: 'FIDO_CERTIFIED' | 'NOT_FIDO_CERTIFIED' | 'FIDO_CERTIFIED_L1' | 'FIDO_CERTIFIED_L2';
  effectiveDate?: string;
  policyVersion?: string;
  protocolFamily?: 'u2f' | 'fido2';
  userVerificationDetails?: string[];
  keyProtection?: string[];
  matcherProtection?: string[];
  cryptoStrength?: number;
  attachmentHint?: string[];
  tcDisplay?: string[];
  attestationRootCertificates?: string[];
  icon?: string;
  supportedExtensions?: Array<{ id: string; tag?: number; data?: string; fail_if_unknown?: boolean }>;
  authenticatorVersion?: number;
  upv?: Array<{ major: number; minor: number }>;
}

export interface WebAuthnAuthenticator {
  id: string;
  transports: string[];
}

export interface UserDetails {
  id: string;
  email: string;
  displayName?: string;
}

export interface WebAuthnOptionsResponse {
  emailAvailable: boolean | null;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    email: string;
    displayName: string;
  } | null;
  challenge: string;
  authenticators: PublicKeyCredentialDescriptorJSON[];
}

export interface WebAuthnOptions<TUser> {
  sessionStorage: SessionStorage;
  rpName: string | ((request: Request) => Promise<string> | string);
  rpID: string | ((request: Request) => Promise<string> | string);
  origin: string | string[] | ((request: Request) => Promise<string | string[]> | string | string[]);
  challengeSessionKey?: string;
  requireUserVerification?: boolean;
  getUserAuthenticators: (user: TUser | null | undefined) => Promise<WebAuthnAuthenticator[]>;
  getUserDetails: (user: TUser | null | undefined) => Promise<UserDetails | null>;
  getUserByEmail: (email: string) => Promise<TUser | null>;
  getAuthenticatorById: (id: string) => Promise<Authenticator | null>;
}

export type WebAuthnVerifyParams = {
  authenticator: Omit<Authenticator, 'userId' | 'createdAt' | 'updatedAt'>;
  type: 'registration' | 'authentication';
  email: string | null;
  displayName?: string;
};

export type SessionData = {
  user: User;
  challenge?: string;
  email?: string;
  challengeCreatedAt?: number;
  authenticatedAt?: number;
};

export type SessionFlashData = {
  error: string;
};

export interface WebAuthnChallenge {
  challenge: string;
  timeout: number;
  userVerification: 'required' | 'preferred' | 'discouraged';
}

export interface WebAuthnRegistrationData {
  id: string;
  rawId: ArrayBufferLike;
  response: {
    attestationObject: ArrayBufferLike;
    clientDataJSON: ArrayBufferLike;
  };
  type: 'public-key';
}

export interface WebAuthnAuthenticationData {
  id: string;
  rawId: ArrayBufferLike;
  response: {
    authenticatorData: ArrayBufferLike;
    clientDataJSON: ArrayBufferLike;
    signature: ArrayBufferLike;
    userHandle?: ArrayBufferLike;
  };
  type: 'public-key';
}

export interface SignInLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export interface SignInActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

export interface SignUpLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export interface SignUpActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}
