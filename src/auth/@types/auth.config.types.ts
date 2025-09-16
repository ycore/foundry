import type { KVBindingNames, SecretNames } from '@ycore/forge/services';

export type AuthConfig = {
  routes: AuthRoutes;
  session: SessionConfig;
  webauthn: WebAuthnConfig;
};

export type AuthRoutes = {
  signup: string;
  signin: string;
  signout: string;
  signedin: string;
  signedout: string;
};

export type SessionConfig = {
  kvBinding: KVBindingNames;
  secretKey: SecretNames;
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
  rpID: string | ((request: Request) => string | Promise<string>);
  origin: string | string[] | ((request: Request) => string | string[] | Promise<string | string[]>);
  challengeSessionKey?: string;
  requireUserVerification?: boolean;
};
