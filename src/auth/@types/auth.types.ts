import type { PublicKeyCredentialDescriptorJSON } from '@simplewebauthn/types';
import type { SessionStorage } from 'react-router';
import type { Authenticator, User } from '../schema';

export interface WebAuthnAuthenticator {
  id: string;
  transports: string[];
}

export interface UserDetails {
  id: string;
  username: string;
  displayName?: string;
}

export interface WebAuthnOptionsResponse {
  usernameAvailable: boolean | null;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    username: string;
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
  getUserByUsername: (username: string) => Promise<TUser | null>;
  getAuthenticatorById: (id: string) => Promise<Authenticator | null>;
}

export type WebAuthnVerifyParams = {
  authenticator: Omit<Authenticator, 'userId' | 'createdAt' | 'updatedAt'>;
  type: 'registration' | 'authentication';
  username: string | null;
  displayName?: string;
};

export type SessionData = {
  user: User;
  challenge?: string;
  username?: string;
};

export type SessionFlashData = {
  error: string;
};
