export type Senders = 'sendgridapi' | 'resend' | 'mailersend';
const authConfig = {
  cookie: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  email: {
    send: false,
    active: <Senders>'resend',
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
  DEV: {
    email_to: undefined,
    username: undefined,
    password: undefined,
  },
};

export default authConfig;
export type AuthConfig = typeof authConfig;
