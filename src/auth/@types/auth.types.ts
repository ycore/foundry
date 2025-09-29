import type { PublicKeyCredentialDescriptorJSON } from '@simplewebauthn/types';
import type { RouterContextProvider, SessionStorage } from 'react-router';
import type { Authenticator, User } from '../schema';

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
};

export type SessionFlashData = {
  error: string;
};

export interface WebAuthnChallenge {
  challenge: string;
  timeout: number;
  userVerification: 'required' | 'preferred' | 'discouraged';
}

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

export interface WebAuthnRegistrationData {
  id: string;
  rawId: ArrayBuffer;
  response: {
    attestationObject: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
  };
  type: 'public-key';
}

export interface WebAuthnAuthenticationData {
  id: string;
  rawId: ArrayBuffer;
  response: {
    authenticatorData: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle?: ArrayBuffer;
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
