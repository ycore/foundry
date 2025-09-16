import type { AuthConfig } from './@types/auth.config.types';

export const defaultAuthConfig: AuthConfig = {
  routes: {
    signup: '/auth/signup',
    signin: '/auth/signin',
    signout: '/auth/signout',
    signedin: '/',
    signedout: '/',
  },
  // webauthn: {
  //   rpName: 'My App',
  //   rpID: 'localhost',
  //   origin: 'http://localhost:5173',
  //   sessionCookie: {
  //     name: '__Host-session', // Use __Host- prefix for additional security
  //     sameSite: 'strict', // Changed from 'lax' to 'strict' for better security
  //     secure: typeof globalThis !== 'undefined' && globalThis.location?.protocol === 'https:',
  //     httpOnly: true,
  //     path: '/',
  //     maxAge: 60 * 60 * 24 * 1, // Reduced from 7 days to 1 day
  //     domain: undefined, // Don't set domain to restrict to exact host
  //   },
  // },
};
