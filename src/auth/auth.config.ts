import type { AuthConfig, AuthRoutes } from './@types/auth.config.types';

export const defaultAuthRoutes: AuthRoutes = {
  signup: '/auth/signup',
  signin: '/auth/signin',
  signout: '/auth/signout',
  signedin: '/',
  signedout: '/',
};

export const defaultAuthConfig: AuthConfig = {
  routes: defaultAuthRoutes,
  session: {
    kvBinding: 'UNCONFIGURED',
    secretKey: 'UNCONFIGURED',
    cookie: {
      name: '__auth_session',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
      secure: 'auto', // Will be determined by environment
    },
  },
  webauthn: {
    rpName: 'React Router Cloudflare App',
    challengeSessionKey: 'challenge',
    requireUserVerification: true, // More secure
  },
};
