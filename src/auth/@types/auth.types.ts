import type { PublicKeyCredentialDescriptorJSON } from '@simplewebauthn/types';
import type { SessionStorage } from 'react-router';
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
