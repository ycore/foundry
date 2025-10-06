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
    rpID: (request: Request) => {
      const hostname = new URL(request.url).hostname;
      // Handle localhost specially for development
      return hostname === 'localhost' || hostname === '127.0.0.1' ? 'localhost' : hostname;
    },
    origin: (request: Request) => {
      const url = new URL(request.url);
      // For development, return array of possible origins
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return ['http://localhost:5173', 'https://localhost:5173', `${url.protocol}//${url.host}`];
      }
      return url.origin;
    },
    challengeSessionKey: 'challenge',
    requireUserVerification: false,
  },
};
