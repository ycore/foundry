import type { KVBindings, SecretBindings } from '@ycore/forge/services';

export type AuthConfig = {
  routes: AuthRoutes;
  session: SessionConfig;
  webauthn: WebAuthnConfig;
  verification: VerificationConfig;
};

export type AuthRoutes = {
  signup: string;
  signin: string;
  signout: string;
  signedin: string;
  signedout: string;
  verify: string;
};

export type SessionConfig = {
  kvBinding: KVBindings;
  secretKey: SecretBindings;
  cookie: {
    name: string;
    httpOnly: boolean;
    maxAge: number;
    path: string;
    sameSite: 'strict' | 'lax' | 'none';
    secure?: 'auto' | boolean;
  };
};

export type WebAuthnConfig = {
  rpName: string;
  kvBinding?: KVBindings;
  challengeSessionKey?: string;
  requireUserVerification?: boolean;
};

export type VerificationConfig = {
  digits: number;
  period: number;
  maxAttempts: number;
  window: number;
  requireEmailVerification: boolean;
  resendCooldown: number;
};
