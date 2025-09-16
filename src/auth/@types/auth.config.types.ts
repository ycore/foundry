// import type { WebAuthnConfig } from './webauthn.types';

export type AuthConfig = {
  routes: AuthRoutes;
  // webauthn: WebAuthnConfig;
};

export type AuthRoutes = {
  signup: string;
  signin: string;
  signout: string;
  signedin: string;
  signedout: string;
};
