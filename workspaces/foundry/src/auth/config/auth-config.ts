const authConfig = {
  cookie: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  email: {
    send: false,
    active: 'mailersend', // sendgridapi / resend
    DEV_TO: import.meta.env?.VITE_EMAIL_TO ?? '',
  },
  totp: {
    digits: 6,
    period: 8 * 60, // 8 minutes
    maxAttempts: 3,
  },
  routes: {
    landing: '/',
    auth: {
      signin: '/auth/signin',
      signup: '/auth/signup',
      signout: '/auth/signout',
      verify: '/auth/verify',
      confirm: '/auth/confirm',
      forgot: '/auth/forgot',
      delete: '/account/delete',
      signedin: '/guard/dashboard',
      signedout: '/',
    },
  },
  DEV_SIGNIN: {
    username: import.meta.env?.VITE_USER_NAME ?? '',
    password: import.meta.env?.VITE_PASS_WORD ?? '',
  },
  custom: {
    filepath: '/@config/config.auth.ts',
  },
};

export type AuthConfig = typeof authConfig;
export default authConfig;
